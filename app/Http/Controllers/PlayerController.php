<?php

namespace App\Http\Controllers;

use App\Models\InstantWinPrize;
use App\Models\Raffle;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PlayerController extends Controller
{
    public function show(Request $request, string $publicId): Response
    {
        $player = User::where('public_id', $publicId)->firstOrFail();
        $viewer = $request->user();
        $isOwner = $viewer?->id === $player->id;
        abort_unless($player->profile_public || $isOwner || $viewer?->is_admin, 404);

        $entries = Ticket::where('user_id', $player->id)
            ->select('raffle_id', DB::raw('count(*) as tickets'), DB::raw('max(created_at) as last_at'))
            ->groupBy('raffle_id')->orderByDesc('last_at')->get();
        $raffles = Raffle::withCardCounts()->whereIn('id', $entries->pluck('raffle_id'))->get()->keyBy('id');

        $drawWins = Raffle::where('status', Raffle::STATUS_DRAWN)
            ->whereIn('winner_ticket_id', Ticket::where('user_id', $player->id)->select('id'))
            ->with('winnerTicket')->latest('drawn_at')->get();

        $instantWins = InstantWinPrize::where('user_id', $player->id)->with('raffle:id,title,slug')
            ->latest('won_at')->take(50)->get();

        return Inertia::render('Players/Show', [
            'player' => [
                'name' => $player->public_name,
                'initials' => mb_strtoupper(mb_substr($player->name, 0, 1).mb_substr($player->surname, 0, 1)),
                'city' => $player->city,
                'country' => $player->countryName(),
                'since' => $player->created_at->toIso8601String(),
                'is_public' => $player->profile_public,
            ],
            'isOwner' => $isOwner,
            'stats' => [
                'competitions' => $entries->count(),
                'tickets' => (int) $entries->sum('tickets'),
                'wins' => $drawWins->count() + $instantWins->count(),
            ],
            'entries' => $entries->take(24)->map(fn ($e) => isset($raffles[$e->raffle_id]) ? [
                ...$raffles[$e->raffle_id]->toCard(),
                'my_tickets' => (int) $e->tickets,
                'entered_at' => \Illuminate\Support\Carbon::parse($e->last_at)->toIso8601String(),
            ] : null)->filter()->values(),
            'wins' => [
                ...$drawWins->map(fn ($r) => [
                    'kind' => 'draw',
                    'title' => $r->title,
                    'slug' => $r->slug,
                    'image_url' => $r->imageUrl(),
                    'category' => $r->category,
                    'value_cents' => $r->retail_value_cents,
                    'number' => $r->winnerTicket?->number,
                    'at' => $r->drawn_at?->toIso8601String(),
                ]),
                ...$instantWins->map(fn ($w) => [
                    'kind' => 'instant',
                    'title' => $w->title,
                    'slug' => $w->raffle->slug,
                    'raffle' => $w->raffle->title,
                    'value_cents' => $w->value_cents,
                    'number' => $w->ticket_number,
                    'at' => $w->won_at->toIso8601String(),
                ]),
            ],
        ]);
    }
}
