<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProfileRequest;
use App\Support\Countries;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        $u = $request->user();

        return Inertia::render('Account/Profile', [
            'profile' => [
                'name' => $u->name,
                'surname' => $u->surname,
                'email' => $u->email,
                'phone' => $u->phone,
                'date_of_birth' => $u->date_of_birth->toDateString(),
                'address_line' => $u->address_line,
                'city' => $u->city,
                'country' => $u->country,
                'post_code' => $u->post_code,
                'profile_public' => $u->profile_public,
            ],
            'publicId' => $u->public_id,
            'countries' => Countries::options(),
        ]);
    }

    public function update(ProfileRequest $request): RedirectResponse
    {
        $request->user()->update([...$request->validated(), 'profile_public' => $request->boolean('profile_public')]);

        return back()->with('success', 'Profile saved.');
    }

    public function password(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        $request->user()->update(['password' => $data['password']]);

        return back()->with('success', 'Password changed.');
    }
}
