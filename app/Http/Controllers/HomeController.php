<?php

namespace App\Http\Controllers;

use App\Models\InstantWinPrize;
use App\Models\Raffle;
use App\Models\Ticket;
use App\Support\MediaUrl;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(): Response
    {
        $live = Raffle::live()->withCardCounts()->orderBy('draws_at')->get();

        // Hero carousel: featured first, then the biggest prizes, then whatever closes next.
        $slides = $live->sortByDesc(fn ($r) => [$r->featured ? 1 : 0, $r->retail_value_cents])->take(5)->values();

        $winners = Raffle::where('status', Raffle::STATUS_DRAWN)
            ->withCardCounts()->with('winnerTicket.user')
            ->latest('drawn_at')->take(6)->get();

        $instant = InstantWinPrize::whereNotNull('won_at')->with(['user:id,name,surname,city,public_id,profile_public', 'raffle:id,title,slug'])
            ->latest('won_at')->take(12)->get();

        return Inertia::render('Home', [
            'hero' => [
                'video' => file_exists(public_path('videos/hero.mp4')) ? '/videos/hero.mp4' : null,
                'poster' => file_exists(public_path('images/hero-poster.jpg'))
                    ? '/images/hero-poster.jpg'
                    : 'https://images.unsplash.com/photo-1715733965684-81ad72895d60?auto=format&fit=crop&w=2400&q=70',
            ],
            'slides' => $slides->map(fn (Raffle $r) => [...$r->toCard(), 'gallery' => $r->galleryUrls()]),
            'raffles' => $live->map->toCard(),
            'instantWins' => $instant->map(fn ($w) => [
                'id' => $w->id,
                'title' => $w->title,
                'value_cents' => $w->value_cents,
                'type' => $w->prize_type,
                'name' => $w->user?->public_name,
                'player_id' => $w->user?->profile_public ? $w->user->public_id : null,
                'city' => $w->user?->city,
                'raffle' => $w->raffle->title,
                'raffle_slug' => $w->raffle->slug,
                'won_at' => $w->won_at->toIso8601String(),
            ]),
            'winners' => $winners->map(fn (Raffle $r) => [
                ...$r->toCard(),
                'winner_name' => $r->winnerTicket?->user?->public_name,
                'winner_player_id' => $r->winnerTicket?->user?->profile_public ? $r->winnerTicket->user->public_id : null,
                'winner_city' => $r->winnerTicket?->user?->city,
                'winner_number' => $r->winnerTicket?->number,
                'winner_entry' => $r->winnerTicket?->entry_type,
                'winner_story' => $r->winner_story,
                'winner_photo_url' => MediaUrl::to($r->winner_photo_path),
            ]),
            'stats' => [
                'tickets' => Ticket::count(),
                'drawn' => Raffle::where('status', Raffle::STATUS_DRAWN)->count(),
                'prize_value_cents' => (int) Raffle::where('status', Raffle::STATUS_DRAWN)->sum('retail_value_cents')
                    + (int) InstantWinPrize::whereNotNull('won_at')->sum('value_cents'),
                'instant_won' => InstantWinPrize::whereNotNull('won_at')->count(),
            ],
        ]);
    }
}
