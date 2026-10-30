<?php

namespace Tests\Feature;

use App\Models\Raffle;
use App\Models\User;
use App\Services\TicketAllocator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_players_cannot_open_admin(): void
    {
        $this->actingAs(User::factory()->create())->get('/admin')->assertForbidden();
    }

    public function test_admin_pages_render(): void
    {
        $admin = User::factory()->admin()->create();
        $raffle = Raffle::factory()->create();

        foreach (['/admin', '/admin/raffles', '/admin/raffles/create', "/admin/raffles/{$raffle->slug}", "/admin/raffles/{$raffle->slug}/edit", '/admin/free-entries', '/admin/users', '/admin/orders'] as $url) {
            $this->actingAs($admin)->get($url)->assertOk();
        }
    }

    public function test_admin_creates_raffle(): void
    {
        $this->actingAs(User::factory()->admin()->create())->post('/admin/raffles', [
            'title' => 'Gold bar 1 kg',
            'description' => 'A one kilogram bar of fine gold.',
            'highlights' => "LBMA certified\nInsured delivery",
            'category' => 'cash',
            'retail_value' => '120000',
            'ticket_price' => '4.99',
            'max_tickets' => 20000,
            'max_per_user' => 200,
            'free_entry_enabled' => true,
            'status' => 'live',
            'draws_at' => now()->addWeek()->format('Y-m-d\TH:i'),
        ])->assertSessionHasNoErrors();

        $raffle = Raffle::firstWhere('slug', 'gold-bar-1-kg');
        $this->assertSame(499, $raffle->ticket_price_cents);
        $this->assertSame(12000000, $raffle->retail_value_cents);
        $this->assertSame(['LBMA certified', 'Insured delivery'], $raffle->highlights);
    }

    public function test_draw_picks_a_winner_once(): void
    {
        $raffle = Raffle::factory()->create();
        $players = User::factory(3)->create();
        foreach ($players as $p) {
            app(TicketAllocator::class)->allocate($raffle, $p, 4, 'paid');
        }

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)->post("/admin/raffles/{$raffle->slug}/draw")->assertSessionHasNoErrors();

        $raffle->refresh();
        $this->assertSame('drawn', $raffle->status);
        $this->assertNotNull($raffle->winner_ticket_id);
        $this->assertSame($raffle->id, $raffle->winnerTicket->raffle_id);

        $this->post("/admin/raffles/{$raffle->slug}/draw")->assertSessionHasErrors('draw');
        $this->get('/winners')->assertOk();
        $this->get("/raffles/{$raffle->slug}")->assertOk();
    }

    public function test_close_expired_command(): void
    {
        $old = Raffle::factory()->create(['draws_at' => now()->subHour()]);
        $new = Raffle::factory()->create();
        $this->artisan('raffles:auto-draw')->assertSuccessful();
        $this->assertSame('closed', $old->fresh()->status);
        $this->assertSame('live', $new->fresh()->status);
    }
}
