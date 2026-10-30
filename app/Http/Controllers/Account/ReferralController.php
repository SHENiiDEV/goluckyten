<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReferralController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();
        $refs = $user->referrals()->latest()->take(50)->get();

        return Inertia::render('Account/Referrals', [
            'link' => url('/r/'.$user->referral_code),
            'code' => $user->referral_code,
            'bonus_cents' => (int) config('company.referral_bonus_cents'),
            'min_spend_cents' => (int) config('company.referral_min_spend_cents'),
            'friends' => $refs->map(fn ($r) => [
                'name' => $r->public_name,
                'joined_at' => $r->created_at->toIso8601String(),
                'rewarded' => (bool) $r->referral_rewarded_at,
            ]),
            'earned_cents' => (int) $user->walletTransactions()->where('type', 'referral')->sum('amount_cents'),
        ]);
    }
}
