<?php

namespace App\Http\Controllers;

use App\Models\InstantWinPrize;
use App\Models\Raffle;
use Inertia\Inertia;
use Inertia\Response;

class WinnersController extends Controller
{
    public function __invoke(): Response
    {
        $drawn = Raffle::where('status', Raffle::STATUS_DRAWN)
            ->withCardCounts()->with('winnerTicket.user')
            ->latest('drawn_at')->paginate(12);

        $instant = InstantWinPrize::whereNotNull('won_at')->with(['user:id,name,surname,city,public_id,profile_public', 'raffle:id,title,slug'])
            ->latest('won_at')->take(30)->get();

        return Inertia::render('Winners', [
            'instantWins' => $instant->map(fn ($w) => [
                'id' => $w->id,
                'title' => $w->title,
                'value_cents' => $w->value_cents,
                'name' => $w->user?->public_name,
                'player_id' => $w->user?->profile_public ? $w->user->public_id : null,
                'city' => $w->user?->city,
                'number' => $w->ticket_number,
                'raffle' => $w->raffle->title,
                'raffle_slug' => $w->raffle->slug,
                'won_at' => $w->won_at->toIso8601String(),
            ]),
            'winners' => $drawn->through(fn (Raffle $r) => [
                ...$r->toCard(),
                'winner_name' => $r->winnerTicket?->user?->public_name,
                'winner_player_id' => $r->winnerTicket?->user?->profile_public ? $r->winnerTicket->user->public_id : null,
                'winner_city' => $r->winnerTicket?->user?->city,
                'winner_number' => $r->winnerTicket?->number,
                'winner_entry' => $r->winnerTicket?->entry_type,
                'winner_story' => $r->winner_story,
                'winner_photo_url' => \App\Support\MediaUrl::to($r->winner_photo_path),
            ]),
        ]);
    }
}
