<?php

namespace App\Models;

use App\Support\MediaUrl;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['raffle_id', 'title', 'prize_type', 'value_cents', 'image_path', 'ticket_number', 'ticket_id', 'user_id', 'won_at', 'fulfilment_status', 'fulfilled_at'])]
class InstantWinPrize extends Model
{
    public const TYPE_CASH = 'cash';
    public const TYPE_ITEM = 'item';

    protected function casts(): array
    {
        return ['won_at' => 'datetime', 'fulfilled_at' => 'datetime'];
    }

    public function raffle(): BelongsTo
    {
        return $this->belongsTo(Raffle::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function imageUrl(): ?string
    {
        return MediaUrl::to($this->image_path);
    }
}
