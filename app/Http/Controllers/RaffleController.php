<?php

namespace App\Http\Controllers;

use App\Models\OrderItem;
use App\Models\Raffle;
use App\Services\InstantWinService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RaffleController extends Controller
{
    public function index(Request $request): Response
    {
        $category = $request->query('category');
        $sort = $request->query('sort', 'ending');

        $query = Raffle::live()->withCardCounts();
        if ($request->query('tab') === 'instant') {
            $query->whereHas('instantWinPrizes', fn ($q) => $q->whereNull('ticket_id'));
        }
        if ($category && array_key_exists($category, Raffle::CATEGORIES)) {
            $query->where('category', $category);
        }
        match ($sort) {
            'value' => $query->orderByDesc('retail_value_cents'),
            'price' => $query->orderBy('ticket_price_cents'),
            'newest' => $query->latest(),
            default => $query->orderBy('draws_at'),
        };

        return Inertia::render('Raffles/Index', [
            'raffles' => $query->get()->map->toCard(),
            'categories' => collect(Raffle::CATEGORIES)->map(fn ($label, $key) => ['key' => $key, 'label' => $label])->values(),
            'filters' => ['category' => $category, 'sort' => $sort, 'tab' => $request->query('tab')],
        ]);
    }

    public function show(Request $request, Raffle $raffle, InstantWinService $instantWins): Response
    {
        abort_if($raffle->status === Raffle::STATUS_DRAFT && ! $request->user()?->is_admin, 404);

        $raffle->loadCount([
            'tickets',
            'instantWinPrizes as instant_total',
            'instantWinPrizes as instant_left' => fn ($q) => $q->whereNull('ticket_id'),
        ])->load('winnerTicket.user');
        $user = $request->user();

        $myTickets = $user
            ? $raffle->tickets()->where('user_id', $user->id)->orderBy('number')->get(['number', 'entry_type'])
            : collect();

        $freeEntry = $user
            ? $raffle->freeEntryRequests()->where('user_id', $user->id)->first(['status', 'reference'])
            : null;

        $related = Raffle::live()->withCardCounts()->where('id', '!=', $raffle->id)
            ->orderBy('draws_at')->take(3)->get()->map->toCard();

        return Inertia::render('Raffles/Show', [
            'raffle' => [
                ...$raffle->toCard(),
                'description' => $raffle->description,
                'highlights' => $raffle->highlights ?? [],
                'max_per_user' => $raffle->max_per_user,
                'gallery' => $raffle->galleryUrls(),
                'video_url' => $raffle->videoUrl(),
                'winner' => $raffle->winnerTicket ? [
                    'name' => $raffle->winnerTicket->user->public_name,
                    'player_id' => $raffle->winnerTicket->user->profile_public ? $raffle->winnerTicket->user->public_id : null,
                    'city' => $raffle->winnerTicket->user->city,
                    'number' => $raffle->winnerTicket->number,
                ] : null,
            ],
            'instantWins' => $instantWins->summary($raffle),
            'myInstantWins' => $user
                ? $raffle->instantWinPrizes()->where('user_id', $user->id)->orderByDesc('value_cents')->get(['title', 'value_cents', 'ticket_number'])
                : [],
            // Real purchases only: who entered recently, with a profile link if they opted in.
            'activity' => OrderItem::query()
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->where('order_items.raffle_id', $raffle->id)->where('orders.status', 'paid')
                ->orderByDesc('orders.paid_at')->select('order_items.*', 'orders.paid_at as paid_at')
                ->with('order.user:id,name,surname,city,public_id,profile_public')
                ->take(10)->get()
                ->map(fn ($i) => [
                    'id' => $i->id,
                    'name' => $i->order->user->public_name,
                    'city' => $i->order->user->city,
                    'player_id' => $i->order->user->profile_public ? $i->order->user->public_id : null,
                    'quantity' => $i->quantity,
                    'at' => \Illuminate\Support\Carbon::parse($i->paid_at ?? $i->created_at)->toIso8601String(),
                ]),
            'myTicketCount' => $myTickets->count(),
            'myTickets' => $myTickets->take(500)->values(),
            'freeEntry' => $freeEntry,
            'related' => $related,
        ]);
    }
}
