<?php

namespace App\Providers;

use App\Services\Payments\PaymentGateway;
use App\Services\Payments\StubGateway;
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
        //
    }
}
