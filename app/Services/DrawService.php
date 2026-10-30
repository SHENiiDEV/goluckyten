<?php

namespace App\Services;

use App\Models\Raffle;
use App\Models\Ticket;
use App\Notifications\SiteNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Provably fair draw (commit–reveal).
 *
 * When a competition is created we generate a secret 256-bit seed and publish its SHA-256 hash.
 * At the draw, every issued ticket is sorted by number and the winner is the one at
 *   index = HMAC-SHA256(seed, "{raffle_id}:{ticket_count}") as a 52-bit integer, mod ticket_count.
 * After the draw the seed is published, so anyone can check the hash and recompute the winner.
 */
class DrawService
{
    public static function indexFor(string $seed, int $raffleId, int $count): int
    {
        $mac = hash_hmac('sha256', "{$raffleId}:{$count}", $seed);

        return (int) (hexdec(substr($mac, 0, 13)) % $count);
    }

    public function draw(Raffle $raffle): Ticket
    {
        $winner = DB::transaction(function () use ($raffle) {
            $raffle = Raffle::lockForUpdate()->findOrFail($raffle->id);

            if ($raffle->status === Raffle::STATUS_DRAWN) {
                throw ValidationException::withMessages(['draw' => 'This raffle has already been drawn.']);
            }
            if ($raffle->status === Raffle::STATUS_DRAFT) {
                throw ValidationException::withMessages(['draw' => 'Publish the raffle before drawing it.']);
            }

            $count = Ticket::where('raffle_id', $raffle->id)->count();
            if ($count === 0) {
                throw ValidationException::withMessages(['draw' => 'There are no tickets to draw from.']);
            }

            if (! $raffle->draw_seed) {
                $raffle->draw_seed = bin2hex(random_bytes(32));
                $raffle->draw_seed_hash = hash('sha256', $raffle->draw_seed);
            }
            $index = self::indexFor($raffle->draw_seed, $raffle->id, $count);
            $winner = Ticket::where('raffle_id', $raffle->id)->orderBy('number')->skip($index)->firstOrFail();

            $raffle->forceFill([
                'status' => Raffle::STATUS_DRAWN,
                'winner_ticket_id' => $winner->id,
                'drawn_at' => now(),
                'draw_audit' => [
                    'method' => 'HMAC-SHA256 commit-reveal',
                    'ticket_count' => $count,
                    'index' => $index,
                    'winning_number' => $winner->number,
                    'seed_hash' => $raffle->draw_seed_hash,
                    'drawn_at' => now()->toIso8601String(),
                ],
            ])->save();

            return $winner;
        });

        $winner->loadMissing('user', 'raffle');
        $winner->user->notify(new SiteNotification(
            "You won {$winner->raffle->title}!",
            "Your ticket #".number_format($winner->number).' was drawn. We’ll call you within 48 hours to arrange your prize.',
            "/raffles/{$winner->raffle->slug}/live",
            email: true,
            kind: 'win',
        ));

        return $winner;
    }
}
