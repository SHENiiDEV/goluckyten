<?php

namespace App\Http\Controllers;

use App\Models\NewsletterSubscriber;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NewsletterController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate(['newsletter_email' => ['required', 'email', 'max:255'], 'newsletter_consent' => ['accepted']], [
            'newsletter_consent.accepted' => 'Tick the box to confirm you’re 18+ and happy to receive emails.',
        ]);

        NewsletterSubscriber::updateOrCreate(
            ['email' => strtolower($data['newsletter_email'])],
            ['unsubscribed_at' => null],
        );

        return back()->with('success', 'You’re on the list. We’ll email you when new competitions open.');
    }
}
