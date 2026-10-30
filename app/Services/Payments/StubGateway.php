<?php

namespace App\Services\Payments;

use App\Models\Order;
use Illuminate\Support\Str;

/**
 * Placeholder gateway: every charge succeeds immediately.
 * Swap for a real provider (Stripe, Adyen, ...) by binding another
 * PaymentGateway implementation in AppServiceProvider.
 */
class StubGateway implements PaymentGateway
{
    public function charge(Order $order): string
    {
        return 'stub_'.Str::lower(Str::random(16));
    }

    public function name(): string
    {
        return 'stub';
    }
}
