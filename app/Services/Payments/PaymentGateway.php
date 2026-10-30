<?php

namespace App\Services\Payments;

use App\Models\Order;

interface PaymentGateway
{
    /**
     * Charge the order. Returns the provider's payment reference on success.
     *
     * @throws PaymentFailed
     */
    public function charge(Order $order): string;

    public function name(): string;
}
