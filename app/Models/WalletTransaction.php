<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'amount_cents', 'balance_after_cents', 'type', 'description', 'order_id', 'instant_win_prize_id'])]
class WalletTransaction extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
