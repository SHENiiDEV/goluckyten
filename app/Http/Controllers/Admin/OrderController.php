<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(): Response
    {
        $orders = Order::with(['user:id,name,surname,email', 'items.raffle:id,title'])->latest()->paginate(25);

        return Inertia::render('Admin/Orders', [
            'orders' => $orders->through(fn (Order $o) => [
                'reference' => $o->reference,
                'user' => $o->user->full_name,
                'email' => $o->user->email,
                'items' => $o->items->map(fn ($i) => $i->quantity.' × '.$i->raffle->title)->all(),
                'total_cents' => $o->total_cents,
                'status' => $o->status,
                'payment_method' => $o->payment_method,
                'created_at' => $o->created_at->toIso8601String(),
            ]),
        ]);
    }
}
