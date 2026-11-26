<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class MakeAdmin extends Command
{
    protected $signature = 'user:admin {email : Email of an account that already registered on the site} {--revoke : Remove admin rights instead}';

    protected $description = 'Give (or take away) admin access for a registered account';

    public function handle(): int
    {
        $user = User::where('email', $this->argument('email'))->first();
        if (! $user) {
            $this->error('No account with that email. Register on the site first, then run this again.');

            return self::FAILURE;
        }

        $user->forceFill(['is_admin' => ! $this->option('revoke')])->save();
        $this->info($user->email.($user->is_admin ? ' is now an admin.' : ' is no longer an admin.'));

        return self::SUCCESS;
    }
}
