<?php

namespace App\Console\Commands;

use App\Models\Raffle;
use App\Models\User;
use App\Notifications\SiteNotification;
use Illuminate\Console\Command;

class SendDrawReminders extends Command
{
    protected $signature = 'raffles:remind';

    protected $description = 'Tell players about draws in the next 24 hours they have tickets for';

    public function handle(): int
    {
        $raffles = Raffle::where('status', Raffle::STATUS_LIVE)->whereNull('reminder_sent_at')
            ->whereBetween('draws_at', [now(), now()->addDay()])->get();

        foreach ($raffles as $raffle) {
            $raffle->forceFill(['reminder_sent_at' => now()])->save();
            User::whereIn('id', $raffle->tickets()->select('user_id')->distinct())
                ->where('notify_draw_reminders', true)->whereNull('anonymised_at')
                ->chunkById(500, function ($users) use ($raffle) {
                    foreach ($users as $user) {
                        $user->notify(new SiteNotification(
                            "{$raffle->title} is drawn tomorrow",
                            'Your tickets are in. The draw is at '.$raffle->draws_at->format('H:i, j M').'. Watch it live.',
                            "/raffles/{$raffle->slug}/live",
                            email: true,
                            kind: 'reminder',
                        ));
                    }
                });
            $this->info("Reminded players of {$raffle->title}");
        }

        return self::SUCCESS;
    }
}
