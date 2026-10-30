<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['raffle_id', 'user_id', 'order_id', 'free_entry_request_id', 'number', 'entry_type'])]
class Ticket extends Model
{
    public const TYPE_PAID = 'paid';
    public const TYPE_FREE = 'free';

    public function raffle(): BelongsTo
    {
        return $this->belongsTo(Raffle::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function freeEntryRequest(): BelongsTo
    {
        return $this->belongsTo(FreeEntryRequest::class);
    }
}
