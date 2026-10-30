<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\InstantWinPrize;
use App\Models\Raffle;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $tickets = Ticket::where('user_id', $user->id)->orderBy('number')->get()->groupBy('raffle_id');
        $raffles = Raffle::withCardCounts()->whereIn('id', $tickets->keys())->get()
            ->sortBy(fn ($r) => [$r->status === Raffle::STATUS_DRAWN ? 1 : 0, $r->draws_at->timestamp]);

        $entries = $raffles->map(function (Raffle $r) use ($tickets) {
            $mine = $tickets[$r->id];

            return [
                'raffle' => $r->toCard(),
                'numbers' => $mine->pluck('number'),
                'free_count' => $mine->where('entry_type', Ticket::TYPE_FREE)->count(),
                'won' => $r->winner_ticket_id && $mine->contains('id', $r->winner_ticket_id),
                'instant_numbers' => InstantWinPrize::where('raffle_id', $r->id)->whereIn('ticket_id', $mine->pluck('id'))->pluck('ticket_number'),
                'winning_number' => $r->winner_ticket_id ? optional($mine->firstWhere('id', $r->winner_ticket_id))->number : null,
            ];
        })->values();

        return Inertia::render('Account/Dashboard', [
            'entries' => $entries,
            'instantWins' => InstantWinPrize::where('user_id', $user->id)->with('raffle:id,title,slug')->latest('won_at')->get()->map(fn ($w) => [
                'id' => $w->id,
                'title' => $w->title,
                'type' => $w->prize_type,
                'value_cents' => $w->value_cents,
                'ticket_number' => $w->ticket_number,
                'raffle' => $w->raffle->title,
                'raffle_slug' => $w->raffle->slug,
                'status' => $w->fulfilment_status,
                'won_at' => $w->won_at->toIso8601String(),
            ]),
            'orders' => $user->orders()->latest()->take(10)->get()->map(fn ($o) => [
                'reference' => $o->reference,
                'total_cents' => $o->total_cents,
                'status' => $o->status,
                'created_at' => $o->created_at->toIso8601String(),
            ]),
            'freeEntries' => $user->freeEntryRequests()->with('raffle:id,title,slug')->latest()->get()->map(fn ($f) => [
                'reference' => $f->reference,
                'status' => $f->status,
                'raffle' => $f->raffle?->title,
                'raffle_slug' => $f->raffle?->slug,
                'created_at' => $f->created_at->toIso8601String(),
            ]),
            'summary' => [
                'active' => $entries->where('raffle.status', '!=', Raffle::STATUS_DRAWN)->count(),
                'tickets' => $tickets->flatten()->count(),
                'wins' => $entries->where('won', true)->count() + InstantWinPrize::where('user_id', $user->id)->count(),
            ],
        ]);
    }
}
