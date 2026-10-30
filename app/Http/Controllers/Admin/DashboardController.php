<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FreeEntryRequest;
use App\Models\Order;
use App\Models\Raffle;
use App\Models\Ticket;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $readyToDraw = Raffle::withCardCounts()
            ->whereIn('status', [Raffle::STATUS_LIVE, Raffle::STATUS_CLOSED])
            ->where(fn ($q) => $q->where('status', Raffle::STATUS_CLOSED)->orWhere('draws_at', '<=', now()))
            ->orderBy('draws_at')->get()->map->toCard();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'revenue_cents' => (int) Order::where('status', 'paid')->sum('total_cents'),
                'revenue_30d_cents' => (int) Order::where('status', 'paid')->where('paid_at', '>=', now()->subDays(30))->sum('total_cents'),
                'tickets' => Ticket::count(),
                'free_tickets' => Ticket::where('entry_type', Ticket::TYPE_FREE)->count(),
                'users' => User::count(),
                'live' => Raffle::live()->count(),
                'pending_free' => FreeEntryRequest::where('status', FreeEntryRequest::STATUS_PENDING)->count(),
            ],
            'readyToDraw' => $readyToDraw,
            'recentOrders' => Order::with('user:id,name,surname,email')->latest()->take(8)->get()->map(fn ($o) => [
                'reference' => $o->reference,
                'user' => $o->user->full_name,
                'email' => $o->user->email,
                'total_cents' => $o->total_cents,
                'status' => $o->status,
                'created_at' => $o->created_at->toIso8601String(),
            ]),
        ]);
    }
}
