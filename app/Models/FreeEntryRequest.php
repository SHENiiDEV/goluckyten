<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['reference', 'user_id', 'raffle_id', 'full_name', 'email', 'address', 'statement', 'status', 'email_received_at', 'admin_note', 'processed_at'])]
class FreeEntryRequest extends Model
{
    /** Code issued on the site; we're waiting for the player's email. */
    public const STATUS_AWAITING_EMAIL = 'awaiting_email';

    /** Email received, being checked. */
    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    protected function casts(): array
    {
        return ['processed_at' => 'datetime', 'email_received_at' => 'datetime'];
    }

    /** Requests an admin can still approve or reject. */
    public const OPEN_STATUSES = [self::STATUS_AWAITING_EMAIL, self::STATUS_PENDING];

    /** Personal code, e.g. FE-7KQ2-M9XD. No 0/O/1/I so it's easy to type from an email. */
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

    public function emailSubject(): string
    {
        return "Free entry {$this->reference}: {$this->raffle->title}";
    }

    /** The email the player fills in and sends to config('company.free_entry_email'). */
    public function emailTemplate(): string
    {
        return implode("\n", [
            'Hello GoLuckyTen,',
            '',
            "Entry code: {$this->reference}",
            "Competition: {$this->raffle->title}",
            '',
            'Full name: [your full name]',
            'Email on my account: [the email you signed up with]',
            'Postal address: [street, house, apartment, city, post code, country]',
            '',
            'My request, in my own words:',
            '[for example: I would like to enter the '.$this->raffle->title.' competition for free.]',
            '',
            'Thank you',
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
