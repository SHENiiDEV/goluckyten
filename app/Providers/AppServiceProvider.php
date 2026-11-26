<?php

namespace App\Providers;

use App\Services\Payments\PaymentGateway;
use App\Services\Payments\StubGateway;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Replace StubGateway with a real provider when payments go live.
        $this->app->bind(PaymentGateway::class, StubGateway::class);
    }

    public function boot(): void
    {
        // On the live server, refuse db:wipe, migrate:fresh, migrate:refresh and migrate:reset unless explicitly overridden.
        $prohibit = $this->app->isProduction() && ! env('ALLOW_DESTRUCTIVE_COMMANDS', false);
        DB::prohibitDestructiveCommands($prohibit);
    }
}
