<?php

namespace App\Models;

use Database\Factories\RaffleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Support\MediaUrl;

#[Fillable([
    'slug', 'title', 'brand', 'subtitle', 'promo_label', 'headline', 'winner_photo_path', 'winner_story', 'description', 'highlights', 'category', 'image_path', 'gallery', 'video_path',
    'retail_value_cents', 'cash_alternative_cents', 'ticket_price_cents', 'max_tickets',
    'max_per_user', 'free_entry_enabled', 'featured', 'status', 'draws_at',
    'sale_price_cents', 'sale_ends_at', 'auto_draw',
])]
#[Hidden(['draw_seed'])]
class Raffle extends Model
{
    /** @use HasFactory<RaffleFactory> */
    use HasFactory;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_LIVE = 'live';
    public const STATUS_CLOSED = 'closed';
    public const STATUS_DRAWN = 'drawn';

    public const STATUSES = [self::STATUS_DRAFT, self::STATUS_LIVE, self::STATUS_CLOSED, self::STATUS_DRAWN];

    public const CATEGORIES = [
        'cars' => 'Cars',
        'watches' => 'Watches',
        'tech' => 'Tech',
        'cash' => 'Cash',
        'travel' => 'Travel',
        'home' => 'Home',
        'jewellery' => 'Jewellery',
    ];

    protected function casts(): array
    {
        return [
            'highlights' => 'array',
            'gallery' => 'array',
            'free_entry_enabled' => 'boolean',
            'featured' => 'boolean',
            'draws_at' => 'datetime',
            'drawn_at' => 'datetime',
            'sale_ends_at' => 'datetime',
            'auto_draw' => 'boolean',
            'draw_audit' => 'array',
            'reminder_sent_at' => 'datetime',
            'announced_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        // Commit to a secret seed up front; its hash is public, the seed is revealed after the draw.
        static::creating(function (Raffle $raffle) {
            if (! $raffle->draw_seed) {
                $raffle->draw_seed = bin2hex(random_bytes(32));
                $raffle->draw_seed_hash = hash('sha256', $raffle->draw_seed);
            }
        });

        // First time a competition goes live, tell players who follow its category.
        static::saved(function (Raffle $raffle) {
            if ($raffle->status === self::STATUS_LIVE && ! $raffle->announced_at && $raffle->draws_at?->isFuture()) {
                app(\App\Services\Announcer::class)->announce($raffle);
            }
        });
    }

    public function isOnSale(): bool
    {
        return $this->sale_price_cents !== null && $this->sale_price_cents < $this->ticket_price_cents
            && ($this->sale_ends_at === null || $this->sale_ends_at->isFuture());
    }

    /** What a ticket costs right now (flash sale aware). */
    public function currentPriceCents(): int
    {
        return $this->isOnSale() ? $this->sale_price_cents : $this->ticket_price_cents;
    }

    /** Ticket pool for a prize: value × multiplier ÷ ticket price (€100 → 10,000 tickets at €0.10). */
    public static function suggestedTickets(int $valueCents, ?int $priceCents = null): int
    {
        $price = max(1, $priceCents ?? config('company.ticket_price_cents'));

        return max(1, (int) ceil($valueCents * config('company.ticket_value_multiplier') / $price));
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    public function winnerTicket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class, 'winner_ticket_id');
    }

    public function instantWinPrizes(): HasMany
    {
        return $this->hasMany(InstantWinPrize::class);
    }

    /** Ticket count plus instant-win totals, as used by cards. */
    public function scopeWithCardCounts(Builder $query): Builder
    {
        return $query->withCount([
            'tickets',
            'instantWinPrizes as instant_total',
            'instantWinPrizes as instant_left' => fn ($q) => $q->whereNull('ticket_id'),
        ]);
    }

    public function freeEntryRequests(): HasMany
    {
        return $this->hasMany(FreeEntryRequest::class);
    }

    public function scopeLive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_LIVE)->where('draws_at', '>', now());
    }

    public function scopeVisible(Builder $query): Builder
    {
        return $query->where('status', '!=', self::STATUS_DRAFT);
    }

    public function isOpen(): bool
    {
        return $this->status === self::STATUS_LIVE && $this->draws_at->isFuture() && $this->ticketsRemaining() > 0;
    }

    public function ticketsSold(): int
    {
        return (int) ($this->tickets_count ?? $this->tickets()->count());
    }

    public function ticketsRemaining(): int
    {
        return max(0, $this->max_tickets - $this->ticketsSold());
    }

    public function imageUrl(): ?string
    {
        return MediaUrl::to($this->image_path);
    }

    /** @return array<int, string> */
    public function galleryUrls(): array
    {
        return array_values(array_filter(array_map([MediaUrl::class, 'to'], $this->gallery ?? [])));
    }

    public function videoUrl(): ?string
    {
        return MediaUrl::to($this->video_path);
    }

    /** Shape used by cards and lists on the public site. */
    public function toCard(): array
    {
        $sold = $this->ticketsSold();

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'brand' => $this->brand,
            'subtitle' => $this->subtitle,
            'promo_label' => $this->promo_label,
            'headline' => $this->headline,
            'category' => $this->category,
            'category_label' => self::CATEGORIES[$this->category] ?? ucfirst($this->category),
            'image_url' => $this->imageUrl(),
            'retail_value_cents' => $this->retail_value_cents,
            'cash_alternative_cents' => $this->cash_alternative_cents,
            'ticket_price_cents' => $this->currentPriceCents(),
            'regular_price_cents' => $this->isOnSale() ? $this->ticket_price_cents : null,
            'sale_ends_at' => $this->isOnSale() ? $this->sale_ends_at?->toIso8601String() : null,
            'max_tickets' => $this->max_tickets,
            'tickets_sold' => $sold,
            'tickets_remaining' => max(0, $this->max_tickets - $sold),
            'free_entry_enabled' => $this->free_entry_enabled,
            'instant_total' => (int) ($this->instant_total ?? 0),
            'instant_left' => (int) ($this->instant_left ?? 0),
            'featured' => $this->featured,
            'status' => $this->status,
            'is_open' => $this->status === self::STATUS_LIVE && $this->draws_at->isFuture() && $sold < $this->max_tickets,
            'draws_at' => $this->draws_at->toIso8601String(),
            'drawn_at' => $this->drawn_at?->toIso8601String(),
        ];
    }
}
