<?php

namespace Tests\Feature;

use App\Models\Raffle;
use App\Models\Ticket;
use App\Models\User;
use App\Services\InstantWinService;
use App\Services\TicketAllocator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PricingAndProfilesTest extends TestCase
{
    use RefreshDatabase;

    public function test_ticket_pool_is_value_times_ten_at_ten_cents(): void
    {
        $this->assertSame(10000, Raffle::suggestedTickets(10000));       // €100 prize
        $this->assertSame(16500000, Raffle::suggestedTickets(16500000)); // €165,000 prize
        $this->assertSame(5000, Raffle::suggestedTickets(10000, 20));    // €0.20 tickets
    }

    public function test_allocator_handles_millions_of_numbers(): void
    {
        $raffle = Raffle::factory()->create(['max_tickets' => 16500000, 'ticket_price_cents' => 10, 'max_per_user' => 50000]);
        $user = User::factory()->create();

        app(InstantWinService::class)->addPrizes($raffle, '€100 cash', 'cash', 10000, 25);
        $tickets = app(TicketAllocator::class)->allocate($raffle, $user, 5000, 'paid');

        $this->assertCount(5000, $tickets);
        $this->assertSame(5000, Ticket::where('raffle_id', $raffle->id)->distinct()->count('number'));
        $this->assertTrue($tickets->every(fn ($t) => $t->number >= 1 && $t->number <= 16500000));
    }

    public function test_allocator_fills_a_nearly_full_pool(): void
    {
        $raffle = Raffle::factory()->create(['max_tickets' => 300, 'max_per_user' => 300]);
        $user = User::factory()->create();
        $alloc = app(TicketAllocator::class);

        $alloc->allocate($raffle, $user, 290, 'paid');
        $alloc->allocate($raffle, $user, 10, 'paid');

        $this->assertEqualsCanonicalizing(range(1, 300), Ticket::pluck('number')->all());
    }

    public function test_buying_hundreds_of_cheap_tickets(): void
    {
        $user = User::factory()->create();
        $raffle = Raffle::factory()->create(['ticket_price_cents' => 10, 'max_tickets' => 100000, 'max_per_user' => 5000]);

        $this->actingAs($user)->post('/basket', ['raffle_id' => $raffle->id, 'quantity' => 2500])->assertSessionHasNoErrors();
        $this->post('/checkout', ['confirm_terms' => true]);

        $this->assertSame(2500, Ticket::where('user_id', $user->id)->count());
    }

    public function test_private_profile_is_hidden_from_others(): void
    {
        $player = User::factory()->create(['profile_public' => false]);

        $this->get("/players/{$player->public_id}")->assertNotFound();
        $this->actingAs(User::factory()->create())->get("/players/{$player->public_id}")->assertNotFound();
        $this->actingAs($player)->get("/players/{$player->public_id}")->assertOk();
    }

    public function test_public_profile_shows_entries_and_wins_but_no_private_data(): void
    {
        $player = User::factory()->create(['profile_public' => true, 'name' => 'Anna', 'surname' => 'Kalnina', 'email' => 'anna@example.com']);
        $raffle = Raffle::factory()->create();
        app(TicketAllocator::class)->allocate($raffle, $player, 12, 'paid');

        $response = $this->get("/players/{$player->public_id}")->assertOk()->assertInertia(fn ($page) => $page
            ->component('Players/Show')
            ->where('player.name', 'Anna K.')
            ->where('stats.tickets', 12)
            ->has('entries', 1));

        $json = json_encode($response->viewData('page'));
        $this->assertStringNotContainsString('anna@example.com', $json);
        $this->assertStringNotContainsString('Kalnina', $json);
        $this->assertStringNotContainsString($player->phone, $json);
    }

    public function test_raffle_page_lists_real_recent_entries(): void
    {
        $buyer = User::factory()->create(['profile_public' => true]);
        $raffle = Raffle::factory()->create();
        $this->actingAs($buyer)->post('/basket', ['raffle_id' => $raffle->id, 'quantity' => 7]);
        $this->post('/checkout', ['confirm_terms' => true]);

        $this->get("/raffles/{$raffle->slug}")->assertInertia(fn ($page) => $page
            ->has('activity', 1)
            ->where('activity.0.quantity', 7)
            ->where('activity.0.player_id', $buyer->public_id));
    }

    public function test_registration_profile_is_private_unless_opted_in(): void
    {
        $base = [
            'password' => 'secret123', 'password_confirmation' => 'secret123', 'name' => 'Ivo', 'surname' => 'Berzins',
            'phone' => '+37120000000', 'date_of_birth' => now()->subYears(30)->toDateString(), 'address_line' => 'Iela 1',
            'city' => 'Riga', 'country' => 'LV', 'post_code' => 'LV-1010', 'terms' => true,
        ];
        $this->post('/register', [...$base, 'email' => 'a@example.com']);
        $this->post('/logout');
        $this->post('/register', [...$base, 'email' => 'b@example.com', 'profile_public' => true]);

        $this->assertFalse(User::firstWhere('email', 'a@example.com')->profile_public);
        $this->assertTrue(User::firstWhere('email', 'b@example.com')->profile_public);
        $this->assertNotNull(User::firstWhere('email', 'a@example.com')->public_id);
    }
}
