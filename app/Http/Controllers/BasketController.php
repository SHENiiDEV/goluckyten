<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Raffle;
use App\Models\Ticket;
use App\Services\Basket;
use App\Services\CheckoutService;
use App\Services\PromoService;
use App\Services\ResponsiblePlay;
use App\Services\TicketAllocator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BasketController extends Controller
{
    public function __construct(private Basket $basket) {}

    public function show(Request $request, PromoService $promos, ResponsiblePlay $responsible): Response
    {
        $lines = $this->basket->lines();
        $subtotal = array_sum(array_column($lines, 'total_cents'));
        $user = $request->user();

        $promo = null;
        $promoError = null;
        if ($code = $request->session()->get('promo_code')) {
            try {
                $p = $promos->validate($promos->find($code), $user, $subtotal);
                $promo = ['code' => $p->code, 'label' => $p->label(), 'discount_cents' => $p->discountFor($subtotal)];
            } catch (ValidationException $e) {
                $promoError = $e->errors()['promo_code'][0] ?? null;
            }
        }

        return Inertia::render('Basket', [
            'lines' => array_map(fn ($l) => [
                'raffle' => [...$l['raffle']->toCard(), 'max_per_user' => $l['raffle']->max_per_user],
                'quantity' => $l['quantity'],
                'numbers' => $l['numbers'],
                'total_cents' => $l['total_cents'],
            ], $lines),
            'subtotal_cents' => $subtotal,
            'promo' => $promo,
            'promoCode' => $request->session()->get('promo_code'),
            'promoError' => $promoError,
            'wallet_cents' => $user?->wallet_balance_cents ?? 0,
            'limit' => $user ? [
                'remaining_cents' => $responsible->remaining($user),
                'excluded_until' => $user->isExcluded() ? $user->excluded_until->toIso8601String() : null,
            ] : null,
        ]);
    }

    public function store(Request $request, TicketAllocator $allocator): RedirectResponse
    {
        $data = $request->validate([
            'raffle_id' => ['required', 'integer', 'exists:raffles,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:100000'],
            'numbers' => ['sometimes', 'array', 'max:500'],
            'numbers.*' => ['integer', 'min:1'],
            'buy_now' => ['sometimes', 'boolean'],
        ]);
        $this->guardExcluded($request);

        $raffle = Raffle::withCardCounts()->findOrFail($data['raffle_id']);
        $numbers = array_values(array_unique($data['numbers'] ?? []));
        $this->guardQuantity($request, $raffle, $this->basket->quantity($raffle->id) + $data['quantity']);

        if ($numbers) {
            if (count($numbers) > $data['quantity']) {
                throw ValidationException::withMessages(['numbers' => 'You picked more numbers than tickets.']);
            }
            $clash = array_intersect($numbers, $this->basket->numbers($raffle->id));
            if ($clash) {
                throw ValidationException::withMessages(['numbers' => 'Already in your basket: #'.implode(', #', $clash)]);
            }
            $allocator->validatePreferred($raffle, $numbers);
        }

        $this->basket->add($raffle->id, $data['quantity'], $numbers);

        if ($request->boolean('buy_now')) {
            return redirect()->route('basket');
        }

        $word = $data['quantity'] === 1 ? 'ticket' : 'tickets';

        return back()
            ->with('success', number_format($data['quantity'])." {$word} for {$raffle->title} added to your basket.")
            ->with('basket_opened', true);
    }

    public function update(Request $request, Raffle $raffle): RedirectResponse
    {
        $data = $request->validate(['quantity' => ['required', 'integer', 'min:0', 'max:100000']]);
        $raffle->loadCount('tickets');

        if ($data['quantity'] > 0) {
            $this->guardQuantity($request, $raffle, $data['quantity']);
        }
        $this->basket->set($raffle->id, $data['quantity']);

        return back();
    }

    public function destroy(Raffle $raffle): RedirectResponse
    {
        $this->basket->remove($raffle->id);

        return back()->with('success', "{$raffle->title} removed from your basket.");
    }

    public function applyPromo(Request $request, PromoService $promos): RedirectResponse
    {
        $data = $request->validate(['promo_code' => ['required', 'string', 'max:32']]);
        $promos->validate($promos->find($data['promo_code']), $request->user(), $this->basket->subtotal());
        $request->session()->put('promo_code', strtoupper(trim($data['promo_code'])));

        return back()->with('success', 'Code applied.');
    }

    public function removePromo(Request $request): RedirectResponse
    {
        $request->session()->forget('promo_code');

        return back();
    }

    public function checkout(Request $request, CheckoutService $checkout): RedirectResponse
    {
        $request->validate(['confirm_terms' => ['accepted']], ['confirm_terms.accepted' => 'Please confirm you have read the Terms & Conditions.']);

        $order = $checkout->checkout($request->user(), $this->basket->raw(), $request->session()->get('promo_code'), $request->boolean('use_wallet'));
        $this->basket->clear();
        $request->session()->forget('promo_code');

        return redirect()->route('account.orders.show', $order)->with('success', 'Payment confirmed. Good luck!');
    }

    /** "Buy again": put the same competitions and quantities back in the basket, if still open. */
    public function repeat(Request $request, Order $order): RedirectResponse
    {
        abort_unless($order->user_id === $request->user()->id, 404);
        $this->guardExcluded($request);

        $added = 0;
        foreach ($order->items()->with('raffle')->get() as $item) {
            $raffle = Raffle::withCardCounts()->find($item->raffle_id);
            if (! $raffle || ! $raffle->isOpen()) {
                continue;
            }
            $owned = Ticket::where('raffle_id', $raffle->id)->where('user_id', $request->user()->id)->count();
            $qty = min($item->quantity, $raffle->ticketsRemaining(), max(0, $raffle->max_per_user - $owned - $this->basket->quantity($raffle->id)));
            if ($qty > 0) {
                $this->basket->add($raffle->id, $qty);
                $added++;
            }
        }

        return $added
            ? redirect()->route('basket')->with('success', 'Same tickets again, ready to pay.')
            : back()->with('error', 'Those competitions are closed now. Have a look at what’s live.');
    }

    /** Availability check and lucky-dip suggestions for "pick your numbers". */
    public function numbers(Request $request, Raffle $raffle, TicketAllocator $allocator): JsonResponse
    {
        $check = collect(explode(',', (string) $request->query('check')))->map(fn ($n) => (int) trim($n))->filter()->unique()->take(500)->values();
        $taken = $check->isEmpty() ? [] : Ticket::where('raffle_id', $raffle->id)->whereIn('number', $check)->pluck('number')->all();

        return response()->json([
            'max' => $raffle->max_tickets,
            'taken' => array_values($taken),
            'out_of_range' => $check->filter(fn ($n) => $n < 1 || $n > $raffle->max_tickets)->values(),
            'suggestions' => $request->filled('suggest') ? $allocator->suggest($raffle, min(50, (int) $request->query('suggest'))) : [],
        ]);
    }

    private function guardExcluded(Request $request): void
    {
        $user = $request->user();
        if ($user && $user->isExcluded()) {
            throw ValidationException::withMessages(['quantity' => 'Your account is self-excluded until '.$user->excluded_until->format('j F Y').'.']);
        }
    }

    private function guardQuantity(Request $request, Raffle $raffle, int $wanted): void
    {
        if (! $raffle->isOpen()) {
            throw ValidationException::withMessages(['quantity' => "{$raffle->title} isn’t open for entries."]);
        }
        if ($wanted > $raffle->ticketsRemaining()) {
            throw ValidationException::withMessages(['quantity' => 'Only '.number_format($raffle->ticketsRemaining()).' tickets are left.']);
        }
        $owned = $request->user()
            ? Ticket::where('raffle_id', $raffle->id)->where('user_id', $request->user()->id)->count()
            : 0;
        if ($owned + $wanted > $raffle->max_per_user) {
            $left = max(0, $raffle->max_per_user - $owned);
            throw ValidationException::withMessages(['quantity' => "The limit is {$raffle->max_per_user} tickets per person. You can add {$left}."]);
        }
    }
}
