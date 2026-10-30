<?php

namespace App\Services;

use App\Models\PromoCode;
use App\Models\PromoRedemption;
use App\Models\User;
use App\Support\Money;
use Illuminate\Validation\ValidationException;

class PromoService
{
    public function find(string $code): ?PromoCode
    {
        return PromoCode::where('code', strtoupper(trim($code)))->first();
    }

    /** Throws a friendly validation error if the code can't be used for this basket. */
    public function validate(?PromoCode $promo, ?User $user, int $subtotalCents): PromoCode
    {
        $fail = fn (string $m) => throw ValidationException::withMessages(['promo_code' => $m]);

        if (! $promo || ! $promo->active) {
            $fail('That code isn’t valid.');
        }
        if ($promo->starts_at && $promo->starts_at->isFuture()) {
            $fail('That code isn’t active yet.');
        }
        if ($promo->ends_at && $promo->ends_at->isPast()) {
            $fail('That code has expired.');
        }
        if ($promo->max_uses !== null && $promo->uses_count >= $promo->max_uses) {
            $fail('That code has been fully used.');
        }
        if ($subtotalCents < $promo->min_spend_cents) {
            $fail('Spend at least '.Money::format($promo->min_spend_cents).' to use this code.');
        }
        if ($user && PromoRedemption::where('promo_code_id', $promo->id)->where('user_id', $user->id)->count() >= $promo->per_user_limit) {
            $fail('You’ve already used this code.');
        }

        return $promo;
    }
}
