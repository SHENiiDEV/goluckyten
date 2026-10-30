<?php

namespace App\Services;

use App\Models\Raffle;
use App\Models\User;
use App\Notifications\SiteNotification;

/** Tells players about a newly published competition in a category they follow. */
class Announcer
{
    public function announce(Raffle $raffle): void
    {
        if ($raffle->announced_at || $raffle->status !== Raffle::STATUS_LIVE) {
            return;
        }
        $raffle->forceFill(['announced_at' => now()])->save();

        User::where('notify_new_competitions', true)->whereNull('anonymised_at')
            ->whereJsonContains('favourite_categories', $raffle->category)
            ->chunkById(500, function ($users) use ($raffle) {
                foreach ($users as $user) {
                    $user->notify(new SiteNotification(
                        'New: '.$raffle->title,
                        'A new '.strtolower(Raffle::CATEGORIES[$raffle->category] ?? 'competition').' competition just opened, from '.\App\Support\Money::format($raffle->currentPriceCents()).' a ticket.',
                        "/raffles/{$raffle->slug}",
                        email: true,
                        kind: 'new',
                    ));
                }
            });
    }
}
