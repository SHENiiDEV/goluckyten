<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use App\Support\Countries;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class RegisterController extends Controller
{
    public function create(\Illuminate\Http\Request $request): Response
    {
        $referrer = ($code = $request->cookie('lt_ref')) ? User::where('referral_code', $code)->first() : null;

        return Inertia::render('Auth/Register', [
            'referrer' => $referrer?->public_name,
            'referralBonusCents' => $referrer ? (int) config('company.referral_bonus_cents') : null,
            'countries' => Countries::options(),
            'minAge' => config('company.min_age'),
        ]);
    }

    public function store(RegisterRequest $request): RedirectResponse
    {
        $data = $request->validated();
        unset($data['terms']);

        $referrer = ($code = $request->cookie('lt_ref')) ? User::where('referral_code', $code)->whereNull('anonymised_at')->first() : null;

        $user = User::create([
            ...$data,
            'profile_public' => $request->boolean('profile_public'),
            'terms_accepted_at' => now(),
            'referred_by_id' => $referrer?->id,
        ]);
        \Illuminate\Support\Facades\Cookie::queue(\Illuminate\Support\Facades\Cookie::forget('lt_ref'));

        event(new Registered($user));
        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended(route('account'))->with('success', "Welcome, {$user->name}. Your account is ready.");
    }
}
