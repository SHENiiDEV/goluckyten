<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cookie;

class ReferralLinkController extends Controller
{
    public function __invoke(string $code): RedirectResponse
    {
        $user = User::where('referral_code', strtoupper($code))->whereNull('anonymised_at')->first();
        $to = redirect()->route('register');

        return $user ? $to->withCookie(Cookie::make('lt_ref', $user->referral_code, 60 * 24 * 30)) : redirect()->route('home');
    }
}
