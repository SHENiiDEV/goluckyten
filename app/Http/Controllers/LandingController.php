<?php

namespace App\Http\Controllers;

use App\Models\InstantWinPrize;
use App\Models\OrderItem;
use App\Models\Raffle;
use App\Models\Ticket;
use App\Models\User;
use App\Support\MediaUrl;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Marketing landing page. Every number and quote on it comes from the database;
 * sections without real data are hidden rather than padded.
 */
class LandingController extends Controller
{
    public function __invoke(): Response
    {
        $live = Raffle::live()->withCardCounts()->orderBy('draws_at')->get();
        $featured = $live->firstWhere('featured', true) ?? $live->sortByDesc('retail_value_cents')->first();

        $topWinner = Raffle::where('status', Raffle::STATUS_DRAWN)->with('winnerTicket.user')
            ->orderByDesc('retail_value_cents')->latest('drawn_at')->first();

        $latestDrawn = Raffle::where('status', Raffle::STATUS_DRAWN)->withCardCounts()->with('winnerTicket.user')
            ->latest('drawn_at')->take(6)->get();

        $instant = InstantWinPrize::whereNotNull('won_at')
            ->with(['user:id,name,surname,city,public_id,profile_public', 'raffle:id,title,slug'])
            ->latest('won_at')->take(8)->get();

        $stories = Raffle::where('status', Raffle::STATUS_DRAWN)->whereNotNull('winner_story')
            ->with('winnerTicket.user')->latest('drawn_at')->take(3)->get();

        $heroArt = collect(['png', 'webp'])->map(fn ($e) => "images/landing/hero.{$e}")
            ->first(fn ($p) => file_exists(public_path($p)));

        $winnerRef = fn (?Raffle $r) => $r?->winnerTicket?->user ? [
            'name' => $r->winnerTicket->user->public_name,
            'city' => $r->winnerTicket->user->city,
            'player_id' => $r->winnerTicket->user->profile_public ? $r->winnerTicket->user->public_id : null,
            'number' => $r->winnerTicket->number,
        ] : null;

        // Biggest instant prizes still hidden in live competitions.
        $instantPool = InstantWinPrize::query()
            ->whereNull('instant_win_prizes.ticket_id')
            ->join('raffles', 'raffles.id', '=', 'instant_win_prizes.raffle_id')
            ->where('raffles.status', Raffle::STATUS_LIVE)->where('raffles.draws_at', '>', now())
            ->groupBy('instant_win_prizes.raffle_id', 'instant_win_prizes.title', 'instant_win_prizes.value_cents', 'instant_win_prizes.prize_type', 'raffles.title', 'raffles.slug')
            ->select('instant_win_prizes.title', 'instant_win_prizes.value_cents', 'instant_win_prizes.prize_type', 'raffles.title as raffle', 'raffles.slug', DB::raw('count(*) as left_count'))
            ->orderByDesc('instant_win_prizes.value_cents')->take(8)->get();

        $recentEntries = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.status', 'paid')
            ->orderByDesc('orders.paid_at')->select('order_items.*', 'orders.paid_at as paid_at')
            ->with(['order.user:id,name,surname,city,public_id,profile_public', 'raffle:id,title,slug'])
            ->take(8)->get();

        $categories = collect(Raffle::CATEGORIES)->map(function ($label, $key) use ($live) {
            $in = $live->where('category', $key);

            return $in->isEmpty() ? null : [
                'key' => $key,
                'label' => $label,
                'count' => $in->count(),
                'image_url' => $in->sortByDesc('retail_value_cents')->first()->imageUrl(),
                'top_value_cents' => (int) $in->max('retail_value_cents'),
            ];
        })->filter()->values();

        return Inertia::render('Landing', [
            'endingSoon' => $live->sortBy('draws_at')->take(3)->values()->map->toCard(),
            'categories' => $categories,
            'instantPool' => $instantPool->map(fn ($p) => [
                'title' => $p->title,
                'value_cents' => (int) $p->value_cents,
                'type' => $p->prize_type,
                'raffle' => $p->raffle,
                'slug' => $p->slug,
                'left' => (int) $p->left_count,
            ]),
            'recentEntries' => $recentEntries->map(fn ($i) => [
                'id' => $i->id,
                'name' => $i->order->user->public_name,
                'city' => $i->order->user->city,
                'player_id' => $i->order->user->profile_public ? $i->order->user->public_id : null,
                'quantity' => $i->quantity,
                'raffle' => $i->raffle->title,
                'slug' => $i->raffle->slug,
                'at' => \Illuminate\Support\Carbon::parse($i->paid_at ?? $i->created_at)->toIso8601String(),
            ]),
            'heroArt' => $heroArt ? '/'.$heroArt : null,
            'featured' => $featured ? [...$featured->toCard(), 'description' => $featured->description] : null,
            'raffles' => $live->map->toCard(),
            'topWinner' => $topWinner ? [
                ...$topWinner->toCard(),
                'winner' => $winnerRef($topWinner),
                'winner_photo_url' => MediaUrl::to($topWinner->winner_photo_path),
            ] : null,
            'latestDrawn' => $latestDrawn->map(fn ($r) => [...$r->toCard(), 'winner' => $winnerRef($r)]),
            'instantWins' => $instant->map(fn ($w) => [
                'id' => $w->id,
                'title' => $w->title,
                'type' => $w->prize_type,
                'value_cents' => $w->value_cents,
                'name' => $w->user?->public_name,
                'city' => $w->user?->city,
                'player_id' => $w->user?->profile_public ? $w->user->public_id : null,
                'raffle_slug' => $w->raffle->slug,
                'won_at' => $w->won_at->toIso8601String(),
            ]),
            'stories' => $stories->map(fn ($r) => [
                'id' => $r->id,
                'story' => $r->winner_story,
                'title' => $r->title,
                'photo_url' => MediaUrl::to($r->winner_photo_path),
                'winner' => $winnerRef($r),
            ]),
            'stats' => [
                'players' => User::where('is_admin', false)->count(),
                'tickets' => Ticket::count(),
                'prizes_won' => Raffle::where('status', Raffle::STATUS_DRAWN)->count() + InstantWinPrize::whereNotNull('won_at')->count(),
                'value_won_cents' => (int) Raffle::where('status', Raffle::STATUS_DRAWN)->sum('retail_value_cents')
                    + (int) InstantWinPrize::whereNotNull('won_at')->sum('value_cents'),
            ],
        ]);
    }
}
