<?php

namespace Database\Seeders;

use App\Models\FreeEntryRequest;
use App\Models\InstantWinPrize;
use App\Models\Order;
use App\Models\Raffle;
use App\Models\Ticket;
use App\Models\User;
use App\Services\InstantWinService;
use App\Services\TicketAllocator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(TicketAllocator $allocator, InstantWinService $instant): void
    {
        User::factory()->admin()->create([
            'name' => 'Site', 'surname' => 'Admin',
            'email' => 'admin@luckyten.test',
        ]);

        $player = User::factory()->create([
            'name' => 'Demo', 'surname' => 'Player',
            'email' => 'player@luckyten.test',
            'city' => 'Riga', 'country' => 'LV',
        ]);

        $players = User::factory(40)->create();

        foreach (RaffleCatalogue::raffles() as $def) {
            $fill = $def['_fill'] ?? fake()->randomFloat(2, 0.12, 0.7);
            $prizes = $def['_instant'] ?? [];
            unset($def['_fill'], $def['_instant']);

            // €0.10 tickets; pool = (main prize + instant prizes) × multiplier ÷ price.
            $pool = $def['retail_value_cents'] + array_sum(array_map(fn ($p) => $p[2] * $p[3], $prizes));
            $def['ticket_price_cents'] = config('company.ticket_price_cents');
            $def['max_tickets'] = Raffle::suggestedTickets($pool);
            $def['max_per_user'] = 5000;

            $raffle = Raffle::create($def);

            foreach ($prizes as [$title, $type, $value, $qty, $image]) {
                $img = $image && (str_starts_with($image, 'http') || file_exists(public_path(ltrim($image, '/')))) ? $image : null;
                $instant->addPrizes($raffle, $title, $type, $value, $qty, $img);
            }

            // Demo sales: a few thousand tickets per competition is plenty to see the site working.
            $this->sell($raffle, $players, (int) min($raffle->max_tickets * $fill, random_int(3000, 12000)), $allocator);
        }

        // Demo player: a few tickets and a pending free entry.
        $porsche = Raffle::firstWhere('slug', 'porsche-911-carrera-s');
        $order = Order::create([
            'reference' => 'RL-DEMO0001', 'user_id' => $player->id, 'total_cents' => 100 * $porsche->ticket_price_cents,
            'status' => 'paid', 'payment_method' => 'stub', 'paid_at' => now(),
        ]);
        $order->items()->create(['raffle_id' => $porsche->id, 'quantity' => 100, 'unit_price_cents' => $porsche->ticket_price_cents, 'total_cents' => 100 * $porsche->ticket_price_cents]);
        $allocator->allocate($porsche, $player, 100, Ticket::TYPE_PAID, ['order_id' => $order->id]);

        $rolex = Raffle::firstWhere('slug', 'rolex-submariner-date');
        FreeEntryRequest::create([
            'reference' => 'FE-DEMO0001', 'user_id' => $player->id, 'raffle_id' => $rolex->id,
            'full_name' => 'Demo Player', 'email' => $player->email, 'address' => $player->fullAddress(),
            'statement' => 'I would like to enter the Rolex Submariner Date raffle for free under the no purchase necessary route.',
        ]);

        // Past winners, drawn with the same provably fair method as live competitions.
        foreach (Raffle::where('status', Raffle::STATUS_DRAWN)->get() as $raffle) {
            $raffle->forceFill(['status' => Raffle::STATUS_CLOSED])->save();
            app(\App\Services\DrawService::class)->draw($raffle);
            $raffle->refresh();
            $raffle->forceFill(['drawn_at' => $raffle->draws_at, 'draw_audit' => [...$raffle->draw_audit, 'drawn_at' => $raffle->draws_at->toIso8601String()]])->save();
        }

        // Some instant prizes already paid out.
        InstantWinPrize::whereNotNull('won_at')->inRandomOrder()->take(10)->update(['fulfilment_status' => 'paid', 'fulfilled_at' => now()]);

        Artisan::call('raffles:sync-media');
    }

    private function sell(Raffle $raffle, $players, int $target, TicketAllocator $allocator): void
    {
        $sold = 0;
        while ($sold < $target) {
            $buyer = $players->random();
            $qty = min([10, 25, 50, 100, 100, 250, 500][random_int(0, 6)], $target - $sold);
            $order = Order::create([
                'reference' => 'RL-'.strtoupper(Str::random(8)),
                'user_id' => $buyer->id,
                'total_cents' => $qty * $raffle->ticket_price_cents,
                'status' => 'paid', 'payment_method' => 'stub', 'paid_at' => now()->subMinutes(random_int(5, 14400)),
            ]);
            $order->items()->create([
                'raffle_id' => $raffle->id, 'quantity' => $qty,
                'unit_price_cents' => $raffle->ticket_price_cents, 'total_cents' => $qty * $raffle->ticket_price_cents,
            ]);
            $allocator->allocate($raffle, $buyer, $qty, Ticket::TYPE_PAID, ['order_id' => $order->id]);
            $sold += $qty;
        }

        // Spread instant-win times so the "just won" feed looks natural.
        InstantWinPrize::where('raffle_id', $raffle->id)->whereNotNull('won_at')->each(
            fn ($p) => $p->update(['won_at' => now()->subMinutes(random_int(3, 7200))])
        );
    }
}
