<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('q'));

        $users = User::withCount('tickets')
            ->withSum(['orders as spent_cents' => fn ($q) => $q->where('status', 'paid')], 'total_cents')
            ->when($search, fn ($q) => $q->where(fn ($q) => $q
                ->where('email', 'like', "%{$search}%")
                ->orWhere('name', 'like', "%{$search}%")
                ->orWhere('surname', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")))
            ->latest()->paginate(25)->withQueryString();

        return Inertia::render('Admin/Users', [
            'users' => $users->through(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->full_name,
                'email' => $u->email,
                'phone' => $u->phone,
                'country' => $u->countryName(),
                'city' => $u->city,
                'date_of_birth' => $u->date_of_birth->toDateString(),
                'is_admin' => $u->is_admin,
                'tickets_count' => $u->tickets_count,
                'spent_cents' => (int) $u->spent_cents,
                'created_at' => $u->created_at->toIso8601String(),
            ]),
            'filters' => ['q' => $search],
        ]);
    }
}
