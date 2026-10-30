<?php

namespace App\Services;

use App\Models\Raffle;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

/**
 * Hands out unique, randomly chosen ticket numbers for a raffle.
 * Works for pools of millions of numbers without loading them into memory.
 * Must be called inside a DB transaction with the raffle row locked.
 */
class TicketAllocator
{
    private const CHECK_CHUNK = 1000;
    private const SCAN_CHUNK = 50000;

    public function __construct(private InstantWinService $instantWins) {}

    /**
     * @param  array{order_id?: int|null, free_entry_request_id?: int|null}  $links
     * @return Collection<int, Ticket>
     */
    public function allocate(Raffle $raffle, User $user, int $quantity, string $type, array $links = [], array $preferred = []): Collection
    {
        $sold = Ticket::where('raffle_id', $raffle->id)->count();
        $remaining = $raffle->max_tickets - $sold;

        if ($quantity > $remaining) {
            throw ValidationException::withMessages([
                'quantity' => $remaining > 0
                    ? 'Only '.number_format($remaining)." tickets are left for {$raffle->title}."
                    : "{$raffle->title} is sold out.",
            ]);
        }

        $chosen = $this->validatePreferred($raffle, array_slice($preferred, 0, $quantity));
        $numbers = array_merge($chosen, $this->pickFree($raffle, $quantity - count($chosen), $remaining - count($chosen), array_flip($chosen)));

        $now = now();
        foreach (array_chunk($numbers, 1000) as $chunk) {
            Ticket::insert(array_map(fn ($n) => [
                'raffle_id' => $raffle->id,
                'user_id' => $user->id,
                'order_id' => $links['order_id'] ?? null,
                'free_entry_request_id' => $links['free_entry_request_id'] ?? null,
                'number' => $n,
                'entry_type' => $type,
                'created_at' => $now,
                'updated_at' => $now,
            ], $chunk));
        }

        $tickets = collect();
        foreach (array_chunk($numbers, self::CHECK_CHUNK) as $chunk) {
            $tickets = $tickets->merge(Ticket::where('raffle_id', $raffle->id)->whereIn('number', $chunk)->get());
        }
        $tickets = $tickets->sortBy('number')->values();

        $this->instantWins->claim($raffle, $tickets);

        return $tickets;
    }

    /**
     * Random sampling checked against the database in batches; falls back to a
     * chunked range scan from a random offset when the pool is almost full.
     *
     * @return array<int, int>
     */
    /** Random free numbers to offer the player (nothing is reserved). */
    public function suggest(Raffle $raffle, int $count): array
    {
        $remaining = $raffle->max_tickets - Ticket::where('raffle_id', $raffle->id)->count();
        $numbers = $this->pickFree($raffle, min($count, $remaining), $remaining);
        sort($numbers);

        return $numbers;
    }

    /**
     * Numbers the player chose: must be in range and still free.
     *
     * @param  array<int, int>  $numbers
     * @return array<int, int>
     */
    public function validatePreferred(Raffle $raffle, array $numbers): array
    {
        $numbers = array_values(array_unique(array_map('intval', $numbers)));
        if (! $numbers) {
            return [];
        }
        $bad = array_filter($numbers, fn ($n) => $n < 1 || $n > $raffle->max_tickets);
        if ($bad) {
            throw ValidationException::withMessages(['numbers' => 'Ticket numbers must be between 1 and '.number_format($raffle->max_tickets).'.']);
        }
        $taken = [];
        foreach (array_chunk($numbers, self::CHECK_CHUNK) as $chunk) {
            $taken = array_merge($taken, Ticket::where('raffle_id', $raffle->id)->whereIn('number', $chunk)->pluck('number')->all());
        }
        if ($taken) {
            sort($taken);
            throw ValidationException::withMessages([
                'numbers' => 'Already taken: '.implode(', ', array_map(fn ($n) => '#'.number_format($n), array_slice($taken, 0, 10))).(count($taken) > 10 ? ' and more' : '').'. Pick different numbers or use a lucky dip.',
            ]);
        }

        return $numbers;
    }

    /** @param  array<int, true>  $exclude */
    private function pickFree(Raffle $raffle, int $quantity, int $remaining, array $exclude = []): array
    {
        if ($quantity <= 0) {
            return [];
        }
        $max = $raffle->max_tickets;
        $picked = [];
        $remaining = max(1, $remaining);
        $freeShare = max($remaining / $max, 0.0001);

        for ($round = 0; $round < 12 && count($picked) < $quantity; $round++) {
            $need = $quantity - count($picked);
            $want = (int) min(20000, max(50, ceil($need / $freeShare * 1.4)));

            $candidates = [];
            for ($k = 0; $k < $want * 3 && count($candidates) < $want; $k++) {
                $n = random_int(1, $max);
                if (! isset($picked[$n]) && ! isset($exclude[$n])) {
                    $candidates[$n] = true;
                }
            }

            $taken = [];
            foreach (array_chunk(array_keys($candidates), self::CHECK_CHUNK) as $chunk) {
                foreach (Ticket::where('raffle_id', $raffle->id)->whereIn('number', $chunk)->pluck('number') as $n) {
                    $taken[$n] = true;
                }
            }

            foreach (array_keys($candidates) as $n) {
                if (! isset($taken[$n])) {
                    $picked[$n] = true;
                    if (count($picked) >= $quantity) {
                        break;
                    }
                }
            }
        }

        if (count($picked) < $quantity) {
            $start = random_int(0, intdiv($max - 1, self::SCAN_CHUNK)) * self::SCAN_CHUNK;
            $chunks = (int) ceil($max / self::SCAN_CHUNK);
            for ($c = 0; $c < $chunks && count($picked) < $quantity; $c++) {
                $from = (($start + $c * self::SCAN_CHUNK) % ($chunks * self::SCAN_CHUNK)) + 1;
                $to = min($max, $from + self::SCAN_CHUNK - 1);
                $taken = Ticket::where('raffle_id', $raffle->id)->whereBetween('number', [$from, $to])->pluck('number')->flip();
                $free = [];
                for ($n = $from; $n <= $to; $n++) {
                    if (! isset($taken[$n]) && ! isset($picked[$n]) && ! isset($exclude[$n])) {
                        $free[] = $n;
                    }
                }
                shuffle($free);
                foreach ($free as $n) {
                    $picked[$n] = true;
                    if (count($picked) >= $quantity) {
                        break;
                    }
                }
            }
        }

        return array_keys($picked);
    }
}
