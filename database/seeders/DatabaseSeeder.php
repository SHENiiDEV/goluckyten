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
use App\Services\WalletService;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(TicketAllocator $allocator, InstantWinService $instant, WalletService $wallet): void
    {
        // Suppress actual outgoing mail during seeding to avoid hitting external SMTP
        config(['mail.default' => 'log']);

        // 1. Admin
        User::factory()->admin()->create([
            'name' => 'Site',
            'surname' => 'Admin',
            'email' => 'admin@luckyten.test',
        ]);

        // 2. Demo Player
        $player = User::factory()->create([
            'name' => 'Demo',
            'surname' => 'Player',
            'email' => 'player@luckyten.test',
            'city' => 'Riga',
            'country' => 'LV',
        ]);

        // 3. 10,000 Realistic European players generated with Faker in bulk
        $faker = Faker::create();
        $passwordHash = Hash::make('password');
        $cities = ['Riga', 'Tallinn', 'Vilnius', 'Berlin', 'Lisbon', 'Dublin', 'Warsaw', 'Prague', 'Vienna', 'Amsterdam', 'Madrid', 'Rome', 'Helsinki', 'Stockholm'];
        $countries = ['LV', 'EE', 'LT', 'DE', 'PT', 'IE', 'PL', 'CZ', 'AT', 'NL', 'ES', 'IT', 'FI', 'SE'];
        $domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'inbox.lv', 'mail.de', 'proton.me'];

        $userRecords = [];
        for ($i = 1; $i <= 10000; $i++) {
            $cIdx = array_rand($countries);
            $domain = $domains[array_rand($domains)];
            $userRecords[] = [
                'name' => $faker->firstName(),
                'surname' => $faker->lastName(),
                'email' => 'player'.$i.'_'.Str::lower(Str::random(4)).'@'.$domain,
                'email_verified_at' => now(),
                'password' => $passwordHash,
                'phone' => '+3712'.$faker->numerify('#######'),
                'date_of_birth' => $faker->dateTimeBetween('-65 years', '-19 years')->format('Y-m-d'),
                'address_line' => $faker->streetAddress(),
                'city' => $cities[$cIdx],
                'country' => $countries[$cIdx],
                'post_code' => $faker->postcode(),
                'terms_accepted_at' => now(),
                'profile_public' => (bool) (mt_rand(1, 100) <= 80),
                'public_id' => Str::lower(Str::random(10)),
                'referral_code' => Str::upper(Str::random(8)),
                'created_at' => now()->subDays(mt_rand(2, 120)),
                'updated_at' => now(),
            ];
        }

        DB::transaction(function () use (&$userRecords) {
            foreach (array_chunk($userRecords, 500) as $chunk) {
                DB::table('users')->insert($chunk);
            }
        });

        // Load active buyer models from our generated player pool
        $players = User::where('is_admin', false)->where('id', '!=', $player->id)->inRandomOrder()->take(2500)->get();

        foreach (RaffleCatalogue::raffles() as $def) {
            $fill = $def['_fill'] ?? fake()->randomFloat(2, 0.25, 0.75);
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

            // Sales across the player pool
            $target = (int) min($raffle->max_tickets * $fill, random_int(3000, 10000));
            $this->sell($raffle, $players, $target, $allocator);

            // Ensure a good spread of instant prizes are won by real ticket holders from our 10,000 players
            if (! empty($prizes)) {
                $this->simulateInstantWins($raffle, $wallet);
            }
        }

        // Demo player: a few tickets and a pending free entry.
        $porsche = Raffle::firstWhere('slug', 'porsche-911-carrera-s');
        if ($porsche) {
            $order = Order::create([
                'reference' => 'RL-DEMO0001', 'user_id' => $player->id, 'total_cents' => 100 * $porsche->ticket_price_cents,
                'status' => 'paid', 'payment_method' => 'stub', 'paid_at' => now(),
            ]);
            $order->items()->create(['raffle_id' => $porsche->id, 'quantity' => 100, 'unit_price_cents' => $porsche->ticket_price_cents, 'total_cents' => 100 * $porsche->ticket_price_cents]);
            $allocator->allocate($porsche, $player, 100, Ticket::TYPE_PAID, ['order_id' => $order->id]);
        }

        $rolex = Raffle::firstWhere('slug', 'rolex-submariner-date');
        if ($rolex) {
            FreeEntryRequest::create([
                'reference' => 'FE-DEMO0001', 'user_id' => $player->id, 'raffle_id' => $rolex->id,
                'full_name' => 'Demo Player', 'email' => $player->email, 'address' => $player->fullAddress(),
                'statement' => 'I would like to enter the Rolex Submariner Date raffle for free under the no purchase necessary route.',
            ]);
        }

        // Past winners, drawn with provably fair method among real ticket holders from our 10,000 players
        foreach (Raffle::where('status', Raffle::STATUS_DRAWN)->get() as $raffle) {
            $raffle->forceFill(['status' => Raffle::STATUS_CLOSED])->save();
            app(\App\Services\DrawService::class)->draw($raffle);
            $raffle->refresh();
            $raffle->forceFill([
                'drawn_at' => $raffle->draws_at,
                'draw_audit' => [...$raffle->draw_audit, 'drawn_at' => $raffle->draws_at->toIso8601String()],
            ])->save();
        }

        Artisan::call('raffles:sync-media');
    }

    private function sell(Raffle $raffle, $players, int $target, TicketAllocator $allocator): void
    {
        $sold = 0;
        while ($sold < $target) {
            $buyer = $players->random();
            $qty = min([10, 20, 25, 50, 50, 100, 100, 200][random_int(0, 7)], $target - $sold);
            $order = Order::create([
                'reference' => 'RL-'.strtoupper(Str::random(8)),
                'user_id' => $buyer->id,
                'total_cents' => $qty * $raffle->ticket_price_cents,
                'status' => 'paid', 'payment_method' => 'stub', 'paid_at' => now()->subMinutes(random_int(10, 20000)),
            ]);
            $order->items()->create([
                'raffle_id' => $raffle->id, 'quantity' => $qty,
                'unit_price_cents' => $raffle->ticket_price_cents, 'total_cents' => $qty * $raffle->ticket_price_cents,
            ]);
            $allocator->allocate($raffle, $buyer, $qty, Ticket::TYPE_PAID, ['order_id' => $order->id]);
            $sold += $qty;
        }

        // Spread instant-win times so the "just won" feed looks natural
        InstantWinPrize::where('raffle_id', $raffle->id)->whereNotNull('won_at')->each(
            fn ($p) => $p->update(['won_at' => now()->subMinutes(random_int(5, 14400))])
        );
    }

    private function simulateInstantWins(Raffle $raffle, WalletService $wallet): void
    {
        $unclaimedPrizes = InstantWinPrize::where('raffle_id', $raffle->id)->whereNull('ticket_id')->get();
        if ($unclaimedPrizes->isEmpty()) {
            return;
        }

        $toWinCount = (int) min($unclaimedPrizes->count(), max(4, (int) round($unclaimedPrizes->count() * 0.45)));
        $soldTickets = Ticket::where('raffle_id', $raffle->id)->inRandomOrder()->take($toWinCount * 3)->get();
        if ($soldTickets->isEmpty()) {
            return;
        }

        $usedTicketNumbers = InstantWinPrize::where('raffle_id', $raffle->id)->pluck('ticket_number')->flip();

        foreach ($unclaimedPrizes->take($toWinCount) as $prize) {
            $ticket = $soldTickets->first(function ($t) use ($usedTicketNumbers, $prize) {
                return ! isset($usedTicketNumbers[$t->number]) || $t->number === $prize->ticket_number;
            });

            if (! $ticket) {
                continue;
            }

            $usedTicketNumbers->forget($prize->ticket_number);
            $usedTicketNumbers[$ticket->number] = true;

            $minutesAgo = random_int(10, 43200); // 10 minutes to 30 days ago
            $isCash = $prize->prize_type === InstantWinPrize::TYPE_CASH;

            $prize->forceFill([
                'ticket_number' => $ticket->number,
                'ticket_id' => $ticket->id,
                'user_id' => $ticket->user_id,
                'won_at' => now()->subMinutes($minutesAgo),
                'fulfilment_status' => 'paid',
                'fulfilled_at' => now()->subMinutes(max(2, $minutesAgo - random_int(5, 60))),
            ])->save();

            $winner = User::find($ticket->user_id);
            if ($winner && $isCash) {
                $wallet->credit(
                    $winner,
                    $prize->value_cents,
                    'instant_win',
                    "Instant win: {$prize->title} (ticket #{$prize->ticket_number}, {$raffle->title})",
                    ['instant_win_prize_id' => $prize->id]
                );
            }
        }
    }
}
