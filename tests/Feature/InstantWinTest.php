<?php

namespace Tests\Feature;

use App\Models\InstantWinPrize;
use App\Models\Order;
use App\Models\Raffle;
use App\Models\Ticket;
use App\Models\User;
use App\Services\InstantWinService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstantWinTest extends TestCase
{
    use RefreshDatabase;

    public function test_prizes_are_hidden_behind_unique_unissued_numbers(): void
    {
        $raffle = Raffle::factory()->create(['max_tickets' => 50]);
        app(\App\Services\TicketAllocator::class)->allocate($raffle, User::factory()->create(), 10, 'paid');

        $count = app(InstantWinService::class)->addPrizes($raffle, '€10 cash', 'cash', 1000, 20);

        $this->assertSame(20, $count);
        $numbers = InstantWinPrize::pluck('ticket_number');
        $this->assertSame(20, $numbers->unique()->count());
        $this->assertTrue($numbers->intersect(Ticket::pluck('number'))->isEmpty());
    }

    public function test_buying_a_winning_number_claims_the_prize(): void
    {
        $raffle = Raffle::factory()->create(['max_tickets' => 20, 'max_per_user' => 20]);
        app(InstantWinService::class)->addPrizes($raffle, '€500 cash', 'cash', 50000, 3);
        $user = User::factory()->create();

        // Buying every ticket guarantees all three are hit.
        $this->actingAs($user)->post('/basket', ['raffle_id' => $raffle->id, 'quantity' => 20]);
        $this->post('/checkout', ['confirm_terms' => true])->assertSessionHasNoErrors();

        $this->assertSame(3, InstantWinPrize::where('user_id', $user->id)->whereNotNull('ticket_id')->count());
        // Cash instant wins land in the wallet straight away.
        $this->assertSame(3, InstantWinPrize::where('fulfilment_status', 'paid')->count());
        $this->assertSame(150000, $user->fresh()->wallet_balance_cents);

        $order = Order::first();
        $this->get("/account/orders/{$order->reference}")->assertInertia(fn ($page) => $page
            ->component('Account/Order')->has('instantWins', 3));
    }

    public function test_public_summary_never_leaks_unclaimed_numbers(): void
    {
        $raffle = Raffle::factory()->create(['max_tickets' => 100]);
        app(InstantWinService::class)->addPrizes($raffle, '€50 cash', 'cash', 5000, 5);

        $this->get("/raffles/{$raffle->slug}")->assertInertia(fn ($page) => $page
            ->where('instantWins.total', 5)
            ->where('instantWins.remaining', 5)
            ->where('instantWins.groups.0.winners', []));

        $json = json_encode($this->get("/raffles/{$raffle->slug}")->viewData('page'));
        foreach (InstantWinPrize::pluck('ticket_number') as $n) {
            $this->assertStringNotContainsString('"ticket_number":'.$n, $json);
        }
    }

    public function test_admin_adds_prizes_and_marks_paid(): void
    {
        $admin = User::factory()->admin()->create();
        $raffle = Raffle::factory()->create(['max_tickets' => 100, 'max_per_user' => 100]);

        $this->actingAs($admin)->post("/admin/raffles/{$raffle->slug}/instant-wins", [
            'title' => 'AirPods Pro', 'prize_type' => 'item', 'value' => '279', 'quantity' => 4,
        ])->assertSessionHasNoErrors();
        $this->assertSame(4, InstantWinPrize::count());

        app(\App\Services\TicketAllocator::class)->allocate($raffle, $admin, 100, 'paid');
        $prize = InstantWinPrize::first();
        $this->assertNotNull($prize->ticket_id);

        $this->get('/admin/instant-wins')->assertOk();
        $this->post("/admin/instant-wins/{$prize->id}/fulfil", ['status' => 'shipped'])->assertSessionHasNoErrors();
        $this->assertSame('shipped', $prize->fresh()->fulfilment_status);
    }

    public function test_seeded_catalogue_builds(): void
    {
        $this->seed();
        $this->assertTrue(Raffle::where('slug', 'porsche-911-carrera-s')->exists());
        $this->assertGreaterThan(0, InstantWinPrize::count());
        $this->assertSame(10, Raffle::firstWhere('slug', 'porsche-911-carrera-s')->ticket_price_cents);
        $this->get('/')->assertOk();
        $this->get('/winners')->assertOk();
    }
}
