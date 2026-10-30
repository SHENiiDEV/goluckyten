<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

#[Fillable([
    'name', 'surname', 'email', 'password', 'phone', 'date_of_birth',
    'address_line', 'city', 'country', 'post_code', 'terms_accepted_at', 'profile_public',
    'referred_by_id', 'session_reminder_minutes', 'favourite_categories', 'notify_draw_reminders', 'notify_new_competitions',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            $user->public_id ??= Str::lower(Str::random(10));
            $user->referral_code ??= Str::upper(Str::random(8));
        });
    }

    /** What other players may see: first name + initial, and a profile link only if the player opted in. */
    public function publicRef(): array
    {
        return [
            'name' => $this->public_name,
            'id' => $this->profile_public ? $this->public_id : null,
        ];
    }

    protected function casts(): array
    {
        return [
            'profile_public' => 'boolean',
            'excluded_until' => 'datetime',
            'pending_spend_limit_at' => 'datetime',
            'pending_spend_limit_remove' => 'boolean',
            'referral_rewarded_at' => 'datetime',
            'anonymised_at' => 'datetime',
            'favourite_categories' => 'array',
            'notify_draw_reminders' => 'boolean',
            'notify_new_competitions' => 'boolean',
            'email_verified_at' => 'datetime',
            'terms_accepted_at' => 'datetime',
            'date_of_birth' => 'date',
            'is_admin' => 'boolean',
            'password' => 'hashed',
        ];
    }

    protected function fullName(): Attribute
    {
        return Attribute::get(fn () => trim($this->name.' '.$this->surname));
    }

    /** Public-safe display name used on the winners wall: "Anna K." */
    protected function publicName(): Attribute
    {
        return Attribute::get(fn () => $this->name.' '.mb_substr($this->surname, 0, 1).'.');
    }

    public function countryName(): string
    {
        return config('countries.all')[$this->country] ?? $this->country;
    }

    public function fullAddress(): string
    {
        return implode(', ', array_filter([$this->address_line, $this->city, $this->post_code, $this->countryName()]));
    }

    public function isExcluded(): bool
    {
        return $this->excluded_until !== null && $this->excluded_until->isFuture();
    }

    public function walletTransactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }

    public function pushSubscriptions(): HasMany
    {
        return $this->hasMany(PushSubscription::class);
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(User::class, 'referred_by_id');
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function freeEntryRequests(): HasMany
    {
        return $this->hasMany(FreeEntryRequest::class);
    }
}
