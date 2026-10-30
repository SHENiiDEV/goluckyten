<?php

namespace App\Support;

class Money
{
    public static function format(int $cents, ?string $currency = null): string
    {
        $currency ??= config('company.currency', 'EUR');
        $symbol = ['EUR' => '€', 'GBP' => '£', 'USD' => '$'][$currency] ?? $currency.' ';

        return $symbol.number_format($cents / 100, 2);
    }
}
