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
        // On the live server, refuse db:wipe, migrate:fresh, migrate:refresh and migrate:reset — even with --force.
        DB::prohibitDestructiveCommands($this->app->isProduction());
    }
}
