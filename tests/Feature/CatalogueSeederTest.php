<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Raffle;
use App\Models\Ticket;
use App\Models\User;
use Database\Seeders\CatalogueSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogueSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalogue_seeder_adds_only_competitions_and_is_rerunnable(): void
    {
        $this->seed(CatalogueSeeder::class);

        $count = Raffle::count();
        $this->assertGreaterThan(5, $count);
        $this->assertSame(0, Raffle::where('status', '!=', Raffle::STATUS_DRAFT)->count());
        $this->assertSame(0, User::count());
        $this->assertSame(0, Order::count());
        $this->assertSame(0, Ticket::count());
        $this->assertGreaterThan(0, \App\Models\InstantWinPrize::count());

        $this->seed(CatalogueSeeder::class);
        $this->assertSame($count, Raffle::count());
    }
}
