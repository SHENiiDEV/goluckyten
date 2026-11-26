<?php

namespace Database\Seeders;

use App\Models\Raffle;
use App\Services\InstantWinService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Competitions only: prizes, ticket pools and instant-win prizes from RaffleCatalogue.
 * Safe for production: no users, no orders, no tickets, no past "winners".
 *
 *   php artisan db:seed --class=CatalogueSeeder --force                    # as drafts (default)
 *   CATALOGUE_STATUS=live php artisan db:seed --class=CatalogueSeeder --force   # published straight away
 *
 * Re-running is safe: competitions whose slug already exists are skipped.
 */
class CatalogueSeeder extends Seeder
{
    public function run(InstantWinService $instant): void
    {
        $status = env('CATALOGUE_STATUS', Raffle::STATUS_DRAFT) === Raffle::STATUS_LIVE ? Raffle::STATUS_LIVE : Raffle::STATUS_DRAFT;
        $created = 0;
        $skipped = 0;

        foreach (RaffleCatalogue::raffles() as $def) {
            // Past draws in the demo catalogue only make sense with demo winners.
            if ($def['status'] === Raffle::STATUS_DRAWN) {
                continue;
            }
            if (Raffle::where('slug', $def['slug'])->exists()) {
                $skipped++;

                continue;
            }

            $prizes = $def['_instant'] ?? [];
            unset($def['_fill'], $def['_instant']);

            // €0.10 tickets; pool = (main prize + instant prizes) × multiplier ÷ price.
            $pool = $def['retail_value_cents'] + array_sum(array_map(fn ($p) => $p[2] * $p[3], $prizes));
            $def['ticket_price_cents'] = config('company.ticket_price_cents');
            $def['max_tickets'] = Raffle::suggestedTickets($pool);
            $def['max_per_user'] = 5000;
            $def['status'] = $status;

            DB::transaction(function () use ($def, $prizes, $instant) {
                $raffle = Raffle::create($def);
                foreach ($prizes as [$title, $type, $value, $qty, $image]) {
                    $img = $image && (str_starts_with($image, 'http') || file_exists(public_path(ltrim($image, '/')))) ? $image : null;
                    $instant->addPrizes($raffle, $title, $type, $value, $qty, $img);
                }
            });
            $created++;
        }

        $this->command?->info("Competitions created: {$created} ({$status}), already there: {$skipped}.");
        if ($status === Raffle::STATUS_DRAFT && $created) {
            $this->command?->line('Review them in /admin/raffles, replace the demo photos with real ones, then publish.');
        }
    }
}
