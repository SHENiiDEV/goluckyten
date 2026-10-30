<?php

namespace App\Services;

use App\Mail\OrderConfirmed;
use App\Models\Order;
use App\Models\PromoRedemption;
use App\Models\Raffle;
use App\Models\Ticket;
use App\Models\User;
use App\Services\Payments\PaymentGateway;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    public function __construct(
        private TicketAllocator $allocator,
        private PaymentGateway $gateway,
        private WalletService $wallet,
        private ResponsiblePlay $responsible,
        private PromoService $promos,
        private InvoiceService $invoices,
        private ReferralService $referrals,
    ) {}

    /**
     * @param  array<int, array{qty: int, numbers: array<int,int>}|int>  $items  raffle_id => line
     */
    public function checkout(User $user, array $items, ?string $promoCode = null, bool $useWallet = false): Order
    {
        $items = array_map(fn ($l) => is_array($l) ? $l : ['qty' => (int) $l, 'numbers' => []], $items);
        if (! $items) {
            throw ValidationException::withMessages(['basket' => 'Your basket is empty.']);
        }

        $order = DB::transaction(function () use ($user, $items, $promoCode, $useWallet) {
            $raffles = Raffle::whereIn('id', array_keys($items))->lockForUpdate()->get()->keyBy('id');

            $subtotal = 0;
            foreach ($items as $raffleId => $line) {
                $raffle = $raffles->get($raffleId);
                if (! $raffle || ! $raffle->isOpen()) {
                    throw ValidationException::withMessages(['basket' => 'One of the competitions in your basket is no longer open.']);
                }
                $owned = Ticket::where('raffle_id', $raffle->id)->where('user_id', $user->id)->count();
                if ($owned + $line['qty'] > $raffle->max_per_user) {
                    $left = max(0, $raffle->max_per_user - $owned);
                    throw ValidationException::withMessages([
                        'quantity' => "You can hold up to {$raffle->max_per_user} tickets for {$raffle->title}. You can buy {$left} more.",
                    ]);
                }
                $subtotal += $line['qty'] * $raffle->currentPriceCents();
            }

            $promo = $promoCode ? $this->promos->validate($this->promos->find($promoCode), $user, $subtotal) : null;
            $discount = $promo ? $promo->discountFor($subtotal) : 0;
            $total = $subtotal - $discount;

            $this->responsible->assertCanSpend($user, $total);

            $walletUse = $useWallet ? min($user->fresh()->wallet_balance_cents, $total) : 0;

            $order = Order::create([
                'reference' => 'LT-'.strtoupper(Str::random(8)),
                'user_id' => $user->id,
                'subtotal_cents' => $subtotal,
                'discount_cents' => $discount,
                'wallet_cents' => $walletUse,
                'promo_code_id' => $promo?->id,
                'total_cents' => $total,
                'currency' => config('company.currency'),
                'status' => 'pending',
                'payment_method' => $walletUse >= $total ? 'wallet' : $this->gateway->name(),
            ]);

            foreach ($items as $raffleId => $line) {
                $raffle = $raffles->get($raffleId);
                $order->items()->create([
                    'raffle_id' => $raffle->id,
                    'quantity' => $line['qty'],
                    'unit_price_cents' => $raffle->currentPriceCents(),
                    'total_cents' => $line['qty'] * $raffle->currentPriceCents(),
                ]);
            }

            if ($walletUse > 0) {
                $this->wallet->debit($user, $walletUse, 'purchase', "Tickets, order {$order->reference}", ['order_id' => $order->id]);
            }
            $reference = $order->chargedCents() > 0 ? $this->gateway->charge($order) : null;

            foreach ($items as $raffleId => $line) {
                $this->allocator->allocate($raffles->get($raffleId), $user, $line['qty'], Ticket::TYPE_PAID, ['order_id' => $order->id], $line['numbers'] ?? []);
            }

            if ($promo) {
                PromoRedemption::create(['promo_code_id' => $promo->id, 'user_id' => $user->id, 'order_id' => $order->id, 'discount_cents' => $discount]);
                $promo->increment('uses_count');
            }

            $order->update([
                'status' => 'paid',
                'payment_reference' => $reference,
                'paid_at' => now(),
                'invoice_number' => $this->invoices->nextNumber(),
            ]);

            $this->referrals->rewardIfDue($user, $order);

            foreach ($raffles as $raffle) {
                if (Ticket::where('raffle_id', $raffle->id)->count() >= $raffle->max_tickets) {
                    $raffle->update(['status' => Raffle::STATUS_CLOSED]);
                }
            }

            return $order;
        });

        // Email after commit; a mail hiccup must never undo a paid order.
        try {
            Mail::to($user->email)->send(new OrderConfirmed($order->fresh()));
        } catch (\Throwable $e) {
            Log::error('Order confirmation email failed', ['order' => $order->reference, 'error' => $e->getMessage()]);
        }

        return $order;
    }
}
