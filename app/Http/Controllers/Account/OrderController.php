<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\InstantWinPrize;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function invoice(Request $request, Order $order, \App\Services\InvoiceService $invoices): \Symfony\Component\HttpFoundation\Response
    {
        abort_unless($order->user_id === $request->user()->id || $request->user()->is_admin, 404);
        abort_unless($order->status === 'paid', 404);
        if (! $order->invoice_number) {
            $order->forceFill(['invoice_number' => $invoices->nextNumber()])->save();
        }

        if ($pdf = $invoices->pdf($order)) {
            return response($pdf, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="'.$invoices->filename($order).'"',
            ]);
        }

        return response($invoices->html($order));
    }

    public function show(Request $request, Order $order): Response
    {
        abort_unless($order->user_id === $request->user()->id || $request->user()->is_admin, 404);

        $order->load(['items.raffle', 'tickets']);
        $byRaffle = $order->tickets->groupBy('raffle_id');
        $wins = InstantWinPrize::whereIn('ticket_id', $order->tickets->pluck('id'))->with('raffle:id,title,slug')
            ->orderByDesc('value_cents')->get();

        return Inertia::render('Account/Order', [
            'instantWins' => $wins->map(fn ($w) => [
                'title' => $w->title,
                'type' => $w->prize_type,
                'value_cents' => $w->value_cents,
                'ticket_number' => $w->ticket_number,
                'raffle' => $w->raffle->title,
                'image_url' => $w->imageUrl(),
            ]),
            'order' => [
                'reference' => $order->reference,
                'status' => $order->status,
                'id' => $order->id,
                'total_cents' => $order->total_cents,
                'subtotal_cents' => $order->subtotal_cents ?: $order->total_cents,
                'discount_cents' => $order->discount_cents,
                'wallet_cents' => $order->wallet_cents,
                'invoice_number' => $order->invoice_number,
                'can_repeat' => $order->items->contains(fn ($i) => $i->raffle->isOpen()),
                'payment_method' => $order->payment_method,
                'created_at' => $order->created_at->toIso8601String(),
                'items' => $order->items->map(fn ($i) => [
                    'title' => $i->raffle->title,
                    'slug' => $i->raffle->slug,
                    'category' => $i->raffle->category,
                    'draws_at' => $i->raffle->draws_at->toIso8601String(),
                    'quantity' => $i->quantity,
                    'unit_price_cents' => $i->unit_price_cents,
                    'total_cents' => $i->total_cents,
                    'numbers' => ($byRaffle[$i->raffle_id] ?? collect())->pluck('number')->sort()->values(),
                    'winning_numbers' => $wins->where('raffle_id', $i->raffle_id)->pluck('ticket_number')->values(),
                ]),
            ],
        ]);
    }
}
