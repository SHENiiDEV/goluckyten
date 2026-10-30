<?php

namespace App\Services;

use App\Models\InstantWinPrize;
use App\Models\Raffle;
use App\Models\Ticket;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InstantWinService
{
    public function __construct(private WalletService $wallet) {}

    /**
     * Hide $quantity identical prizes behind random ticket numbers that haven't been issued yet.
     */
    public function addPrizes(Raffle $raffle, string $title, string $type, int $valueCents, int $quantity, ?string $imagePath = null): int
    {
        return DB::transaction(function () use ($raffle, $title, $type, $valueCents, $quantity, $imagePath) {
            $raffle = Raffle::lockForUpdate()->findOrFail($raffle->id);

            $sold = Ticket::where('raffle_id', $raffle->id)->count();
            $hidden = InstantWinPrize::where('raffle_id', $raffle->id)->pluck('ticket_number')->flip();

            $available = $raffle->max_tickets - $sold - $hidden->count();
            if ($quantity > $available) {
                throw ValidationException::withMessages(['quantity' => "Only {$available} unissued ticket numbers are left to hide prizes behind."]);
            }

            // Sample random numbers, then drop any that were issued or already hide a prize.
            $picked = [];
            for ($round = 0; $round < 20 && count($picked) < $quantity; $round++) {
                $candidates = [];
                $want = min(20000, ($quantity - count($picked)) * 3 + 10);
                for ($k = 0; $k < $want * 3 && count($candidates) < $want; $k++) {
                    $n = random_int(1, $raffle->max_tickets);
                    if (! isset($hidden[$n]) && ! isset($picked[$n])) {
                        $candidates[$n] = true;
                    }
                }
                $issued = [];
                foreach (array_chunk(array_keys($candidates), 1000) as $chunk) {
                    foreach (Ticket::where('raffle_id', $raffle->id)->whereIn('number', $chunk)->pluck('number') as $n) {
                        $issued[$n] = true;
                    }
                }
                foreach (array_keys($candidates) as $n) {
                    if (! isset($issued[$n])) {
                        $picked[$n] = true;
                        if (count($picked) >= $quantity) {
                            break;
                        }
                    }
                }
            }
            if (count($picked) < $quantity) {
                $issued = Ticket::where('raffle_id', $raffle->id)->pluck('number')->flip();
                for ($n = 1; $n <= $raffle->max_tickets && count($picked) < $quantity; $n++) {
                    if (! isset($issued[$n]) && ! isset($hidden[$n]) && ! isset($picked[$n])) {
                        $picked[$n] = true;
                    }
                }
            }

            $now = now();
            foreach (array_chunk(array_keys($picked), 1000) as $chunk) InstantWinPrize::insert(array_map(fn ($n) => [
                'raffle_id' => $raffle->id,
                'title' => $title,
                'prize_type' => $type,
                'value_cents' => $valueCents,
                'image_path' => $imagePath,
                'ticket_number' => $n,
                'created_at' => $now,
                'updated_at' => $now,
            ], $chunk));

            return count($picked);
        });
    }

    /**
     * Mark any instant prizes hit by these freshly issued tickets.
     *
     * @param  Collection<int, Ticket>  $tickets
     * @return Collection<int, InstantWinPrize>
     */
    public function claim(Raffle $raffle, Collection $tickets): Collection
    {
        if ($tickets->isEmpty()) {
            return collect();
        }

        $byNumber = $tickets->keyBy('number');
        $hits = InstantWinPrize::where('raffle_id', $raffle->id)
            ->whereNull('ticket_id')
            ->whereIn('ticket_number', $byNumber->keys())
            ->get();

        foreach ($hits as $prize) {
            $ticket = $byNumber[$prize->ticket_number];
            $cash = $prize->prize_type === InstantWinPrize::TYPE_CASH;
            $prize->update([
                'ticket_id' => $ticket->id,
                'user_id' => $ticket->user_id,
                'won_at' => now(),
                // Cash lands in the player's wallet straight away; items wait for dispatch.
                'fulfilment_status' => $cash ? 'paid' : 'pending',
                'fulfilled_at' => $cash ? now() : null,
            ]);

            $winner = $ticket->relationLoaded('user') ? $ticket->user : \App\Models\User::find($ticket->user_id);
            if ($cash) {
                $this->wallet->credit($winner, $prize->value_cents, 'instant_win', "Instant win: {$prize->title} (ticket #{$prize->ticket_number}, {$raffle->title})", ['instant_win_prize_id' => $prize->id]);
            }
            $winner->notify(new \App\Notifications\SiteNotification(
                "You won {$prize->title}!",
                "Ticket #{$prize->ticket_number} in {$raffle->title} was an instant win.".($cash ? ' The cash is already in your balance.' : ' We’ll be in touch to arrange delivery.'),
                $cash ? '/account/wallet' : '/account',
                kind: 'win',
            ));
        }

        return $hits;
    }

    /** Public summary for a raffle page: grouped prizes, never revealing unclaimed numbers. */
    public function summary(Raffle $raffle): array
    {
        $prizes = InstantWinPrize::where('raffle_id', $raffle->id)->with('user:id,name,surname,public_id,profile_public')
            ->orderByDesc('value_cents')->orderBy('id')->get();

        $groups = $prizes->groupBy(fn ($p) => $p->title.'|'.$p->value_cents)->map(function ($group) {
            $first = $group->first();

            return [
                'title' => $first->title,
                'type' => $first->prize_type,
                'value_cents' => $first->value_cents,
                'image_url' => $first->imageUrl(),
                'total' => $group->count(),
                'remaining' => $group->whereNull('ticket_id')->count(),
                'winners' => $group->whereNotNull('ticket_id')->sortByDesc('won_at')->take(6)->map(fn ($p) => [
                    'name' => $p->user?->public_name ?? 'Player',
                    'player_id' => $p->user?->profile_public ? $p->user->public_id : null,
                    'number' => $p->ticket_number,
                ])->values(),
            ];
        })->values();

        return [
            'groups' => $groups,
            'total' => $prizes->count(),
            'remaining' => $prizes->whereNull('ticket_id')->count(),
            'total_value_cents' => (int) $prizes->sum('value_cents'),
        ];
    }
}
