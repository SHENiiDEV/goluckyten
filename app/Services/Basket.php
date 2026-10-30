<?php

namespace App\Services;

use App\Models\Raffle;
use Illuminate\Contracts\Session\Session;

/**
 * Session basket: raffle_id => ['qty' => int, 'numbers' => int[]].
 * `numbers` are tickets the player picked themselves; the rest of `qty` is a lucky dip.
 */
class Basket
{
    private const KEY = 'basket';

    public function __construct(private Session $session) {}

    /** @return array<int, array{qty: int, numbers: array<int, int>}> */
    public function raw(): array
    {
        $out = [];
        foreach ($this->session->get(self::KEY, []) as $id => $line) {
            $out[(int) $id] = is_array($line)
                ? ['qty' => (int) $line['qty'], 'numbers' => array_values(array_map('intval', $line['numbers'] ?? []))]
                : ['qty' => (int) $line, 'numbers' => []];
        }

        return $out;
    }

    public function quantity(int $raffleId): int
    {
        return $this->raw()[$raffleId]['qty'] ?? 0;
    }

    public function numbers(int $raffleId): array
    {
        return $this->raw()[$raffleId]['numbers'] ?? [];
    }

    /** @param  array<int, int>|null  $numbers  null keeps the existing picks (trimmed to qty) */
    public function set(int $raffleId, int $quantity, ?array $numbers = null): void
    {
        $items = $this->raw();
        if ($quantity <= 0) {
            unset($items[$raffleId]);
        } else {
            $picked = $numbers ?? ($items[$raffleId]['numbers'] ?? []);
            $picked = array_slice(array_values(array_unique(array_map('intval', $picked))), 0, $quantity);
            $items[$raffleId] = ['qty' => $quantity, 'numbers' => $picked];
        }
        $this->session->put(self::KEY, $items);
    }

    /** @param  array<int, int>  $numbers */
    public function add(int $raffleId, int $quantity, array $numbers = []): int
    {
        $new = $this->quantity($raffleId) + $quantity;
        $this->set($raffleId, $new, array_merge($this->numbers($raffleId), $numbers));

        return $new;
    }

    public function remove(int $raffleId): void
    {
        $this->set($raffleId, 0);
    }

    public function clear(): void
    {
        $this->session->forget(self::KEY);
    }

    public function count(): int
    {
        return array_sum(array_column($this->raw(), 'qty'));
    }

    public function subtotal(): int
    {
        return array_sum(array_column($this->lines(), 'total_cents'));
    }

    /**
     * Resolved lines; silently drops raffles that are no longer open.
     *
     * @return array<int, array{raffle: Raffle, quantity: int, numbers: array<int,int>, total_cents: int}>
     */
    public function lines(): array
    {
        $raw = $this->raw();
        if (! $raw) {
            return [];
        }

        $raffles = Raffle::withCardCounts()->whereIn('id', array_keys($raw))->get()->keyBy('id');
        $lines = [];
        foreach ($raw as $id => $line) {
            $raffle = $raffles->get($id);
            if (! $raffle || ! $raffle->isOpen()) {
                $this->remove($id);

                continue;
            }
            $lines[] = [
                'raffle' => $raffle,
                'quantity' => $line['qty'],
                'numbers' => $line['numbers'],
                'total_cents' => $line['qty'] * $raffle->currentPriceCents(),
            ];
        }

        return $lines;
    }
}
