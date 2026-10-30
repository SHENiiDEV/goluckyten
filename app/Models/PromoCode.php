<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['code', 'type', 'value', 'min_spend_cents', 'max_uses', 'uses_count', 'per_user_limit', 'starts_at', 'ends_at', 'active'])]
class PromoCode extends Model
{
    protected function casts(): array
    {
        return ['starts_at' => 'datetime', 'ends_at' => 'datetime', 'active' => 'boolean'];
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(PromoRedemption::class);
    }

    public function discountFor(int $subtotalCents): int
    {
        $discount = $this->type === 'percent'
            ? intdiv($subtotalCents * min(100, $this->value), 100)
            : $this->value;

        return min($discount, $subtotalCents);
    }

    public function label(): string
    {
        return $this->type === 'percent' ? "{$this->value}% off" : \App\Support\Money::format($this->value).' off';
    }
}
