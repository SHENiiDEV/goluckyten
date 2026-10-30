<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['reference', 'invoice_number', 'user_id', 'subtotal_cents', 'discount_cents', 'wallet_cents', 'promo_code_id', 'total_cents', 'currency', 'status', 'payment_method', 'payment_reference', 'paid_at'])]
class Order extends Model
{
    protected function casts(): array
    {
        return ['paid_at' => 'datetime'];
    }

    public function getRouteKeyName(): string
    {
        return 'reference';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function promoCode(): BelongsTo
    {
        return $this->belongsTo(PromoCode::class);
    }

    /** What went through the payment gateway (after discount and wallet). */
    public function chargedCents(): int
    {
        return max(0, $this->total_cents - $this->wallet_cents);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }
}
