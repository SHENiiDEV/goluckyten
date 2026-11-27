<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['reference', 'user_id', 'raffle_id', 'full_name', 'email', 'address', 'statement', 'status', 'letter_received_at', 'admin_note', 'processed_at'])]
class FreeEntryRequest extends Model
{
    /** Code issued on the site; we're waiting for the player's posted letter. */
    public const STATUS_AWAITING_LETTER = 'awaiting_letter';

    /** Letter received, being checked. */
    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    protected function casts(): array
    {
        return ['processed_at' => 'datetime', 'letter_received_at' => 'datetime'];
    }

    /** Requests an admin can still approve or reject. */
    public const OPEN_STATUSES = [self::STATUS_AWAITING_LETTER, self::STATUS_PENDING];

    /** Personal code, e.g. FE-7KQ2-M9XD. No 0/O/1/I so it's easy to read from a handwritten letter. */
    public static function newCode(): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        do {
            $raw = '';
            for ($i = 0; $i < 8; $i++) {
                $raw .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
            $code = 'FE-'.substr($raw, 0, 4).'-'.substr($raw, 4);
        } while (static::where('reference', $code)->exists());

        return $code;
    }

    /** Where players post their letter: config('company.free_entry_address'), one line per comma. */
    public static function postalAddressLines(): array
    {
        return array_values(array_filter(array_map('trim', explode(',', (string) config('company.free_entry_address')))));
    }

    /** The letter the player writes (or prints and fills in) and posts to us. */
    public function letterTemplate(): string
    {
        return implode("\n", [
            '[your full name]',
            '[your postal address: street, house, apartment, city, post code, country]',
            '',
            config('company.name'),
            ...static::postalAddressLines(),
            '',
            'Date: [the date you post it]',
            '',
            "Free entry code: {$this->reference}",
            "Competition: {$this->raffle->title}",
            '',
            'Dear GoLuckyTen,',
            '',
            '[your request in your own words, for example: I would like to enter the '.$this->raffle->title.' competition for free.]',
            '',
            'Email on my account: [the email you signed up with]',
            '',
            '[your signature]',
        ]);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function raffle(): BelongsTo
    {
        return $this->belongsTo(Raffle::class);
    }

    public function ticket(): HasOne
    {
        return $this->hasOne(Ticket::class);
    }
}
