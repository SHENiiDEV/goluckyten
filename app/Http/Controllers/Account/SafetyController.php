<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Services\ResponsiblePlay;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SafetyController extends Controller
{
    public function show(Request $request, ResponsiblePlay $rp): Response
    {
        $u = $request->user();
        $rp->applyPending($u);

        return Inertia::render('Account/Safety', [
            'limit' => [
                'cents' => $u->spend_limit_cents,
                'period' => $u->spend_limit_period,
                'spent_cents' => $u->spend_limit_period ? $rp->spent($u, $u->spend_limit_period) : null,
                'remaining_cents' => $rp->remaining($u),
            ],
            'pending' => $u->pending_spend_limit_at ? [
                'cents' => $u->pending_spend_limit_cents,
                'period' => $u->pending_spend_limit_period,
                'remove' => $u->pending_spend_limit_remove,
                'at' => $u->pending_spend_limit_at->toIso8601String(),
            ] : null,
            'periods' => ResponsiblePlay::PERIODS,
            'excluded_until' => $u->isExcluded() ? $u->excluded_until->toIso8601String() : null,
            'reminder_minutes' => $u->session_reminder_minutes,
            'spent' => [
                'day' => $rp->spent($u, 'day'),
                'week' => $rp->spent($u, 'week'),
                'month' => $rp->spent($u, 'month'),
            ],
        ]);
    }

    public function limit(Request $request, ResponsiblePlay $rp): RedirectResponse
    {
        $data = $request->validate([
            'amount' => ['nullable', 'numeric', 'min:1', 'max:100000'],
            'period' => ['required_with:amount', 'nullable', Rule::in(array_keys(ResponsiblePlay::PERIODS))],
        ]);
        $cents = isset($data['amount']) ? (int) round($data['amount'] * 100) : null;
        $result = $rp->setLimit($request->user(), $cents, $data['period'] ?? null);

        return back()->with('success', $result === 'immediate'
            ? ($cents === null ? 'Spend limit removed.' : 'Your new limit is active now.')
            : 'Saved. Because this loosens your limit, it starts in 24 hours.');
    }

    public function cancelPending(Request $request): RedirectResponse
    {
        $request->user()->forceFill([
            'pending_spend_limit_cents' => null, 'pending_spend_limit_period' => null,
            'pending_spend_limit_at' => null, 'pending_spend_limit_remove' => false,
        ])->save();

        return back()->with('success', 'Pending change cancelled. Your current limit stays.');
    }

    public function exclude(Request $request, ResponsiblePlay $rp): RedirectResponse
    {
        $data = $request->validate([
            'length' => ['required', Rule::in(['24h', '1w', '1m', '6m', '1y', '5y'])],
            'password' => ['required', 'current_password'],
        ]);
        $user = $request->user();
        if ($user->isExcluded()) {
            return back()->with('error', 'You’re already taking a break. It can’t be shortened.');
        }
        $rp->exclude($user, $data['length']);
        $request->session()->forget('basket');

        return back()->with('success', 'Break started. You can still sign in, see your tickets and withdraw your balance.');
    }

    public function reminder(Request $request): RedirectResponse
    {
        $data = $request->validate(['minutes' => ['nullable', 'integer', Rule::in([15, 30, 60, 90, 120])]]);
        $request->user()->forceFill(['session_reminder_minutes' => $data['minutes'] ?? null])->save();

        return back()->with('success', 'Reminder saved.');
    }
}
