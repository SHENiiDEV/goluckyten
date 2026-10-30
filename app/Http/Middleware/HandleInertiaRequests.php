<?php

namespace App\Http\Middleware;

use App\Models\InstantWinPrize;
use App\Models\Raffle;
use App\Services\Basket;
use App\Support\Money;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'app' => [
                'name' => config('app.name'),
                'currency' => config('company.currency'),
            ],
            'company' => [
                'name' => config('company.name'),
                'number' => config('company.number'),
                'address' => config('company.address'),
                'email' => config('company.email'),
                'free_entry_email' => config('company.free_entry_email'),
            ],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'surname' => $user->surname,
                    'email' => $user->email,
                    'is_admin' => $user->is_admin,
                    'public_id' => $user->public_id,
                    'wallet_balance_cents' => $user->wallet_balance_cents,
                    'unread_notifications' => fn () => $user->unreadNotifications()->count(),
                    'excluded_until' => $user->isExcluded() ? $user->excluded_until->toIso8601String() : null,
                    'session_reminder_minutes' => $user->session_reminder_minutes,
                ] : null,
            ],
            'categories' => collect(Raffle::CATEGORIES)->map(fn ($label, $key) => ['key' => $key, 'label' => $label])->values(),
            'ticker' => fn () => Cache::remember('ticker', 60, fn () => $this->ticker()),
            'basket' => [
                'count' => fn () => app(Basket::class)->count(),
                // Lines for the slide-out basket drawer.
                'lines' => fn () => array_map(fn ($l) => [
                    'id' => $l['raffle']->id,
                    'slug' => $l['raffle']->slug,
                    'title' => $l['raffle']->title,
                    'image_url' => $l['raffle']->imageUrl(),
                    'quantity' => $l['quantity'],
                    'numbers' => $l['numbers'],
                    'ticket_price_cents' => $l['raffle']->currentPriceCents(),
                    'total_cents' => $l['total_cents'],
                    'draws_at' => $l['raffle']->draws_at->toIso8601String(),
                ], app(Basket::class)->lines()),
            ],
            'push' => ['key' => config('company.vapid_public_key')],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'basket_opened' => fn () => (bool) $request->session()->get('basket_opened'),
            ],
        ];
    }

    /**
     * News strip built only from real events: recent paid entries, instant wins, draw winners
     * and live competition facts. Shuffled and de-duplicated per player so it never loops one name.
     */
    private function ticker(): array
    {
        $people = [];
        $seen = [];
        $who = function ($user) use (&$seen) {
            if (! $user || isset($seen[$user->id])) {
                return null;
            }
            $seen[$user->id] = true;

            return $user->public_name.($user->city ? " from {$user->city}" : '');
        };

        $entries = \App\Models\OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.status', 'paid')
            ->orderByDesc('orders.paid_at')->select('order_items.*')
            ->with(['order.user:id,name,surname,city', 'raffle:id,title,slug'])
            ->take(60)->get();
        foreach ($entries as $e) {
            if ($name = $who($e->order->user)) {
                $people[] = ['icon' => '🎟', 'text' => "{$name} entered {$e->raffle->title} with ".number_format($e->quantity).' '.($e->quantity === 1 ? 'ticket' : 'tickets'), 'href' => "/raffles/{$e->raffle->slug}"];
            }
        }

        $wins = InstantWinPrize::whereNotNull('won_at')->with(['user:id,name,surname,city', 'raffle:id,slug'])->latest('won_at')->take(20)->get();
        foreach ($wins as $w) {
            if ($name = $who($w->user)) {
                $people[] = ['icon' => '⚡', 'text' => "{$name} won {$w->title} instantly", 'href' => "/raffles/{$w->raffle->slug}"];
            }
        }

        $drawn = Raffle::where('status', Raffle::STATUS_DRAWN)->with('winnerTicket.user:id,name,surname,city')->latest('drawn_at')->take(5)->get();
        foreach ($drawn as $r) {
            $u = $r->winnerTicket?->user;
            if ($u) {
                $people[] = ['icon' => '🏆', 'text' => $u->public_name.($u->city ? " from {$u->city}" : '')." won {$r->title}", 'href' => "/raffles/{$r->slug}"];
            }
        }

        shuffle($people);
        $people = array_slice($people, 0, 18);

        $facts = [];
        foreach (Raffle::live()->withCardCounts()->orderBy('draws_at')->take(8)->get() as $r) {
            $facts[] = $r->instant_left > 0
                ? ['icon' => '⚡', 'text' => "{$r->title}: {$r->instant_left} instant wins still to be won", 'href' => "/raffles/{$r->slug}"]
                : ['icon' => '⏰', 'text' => "{$r->title} is drawn ".$r->draws_at->diffForHumans(), 'href' => "/raffles/{$r->slug}"];
        }
        $facts[] = ['icon' => '✉️', 'text' => 'Every competition can be entered for free', 'href' => '/free-entry'];
        shuffle($facts);

        // Interleave: two people, one fact.
        $items = [];
        while ($people || $facts) {
            for ($k = 0; $k < 2 && $people; $k++) {
                $items[] = array_shift($people);
            }
            if ($facts) {
                $items[] = array_shift($facts);
            }
        }

        return $items;
    }
}
