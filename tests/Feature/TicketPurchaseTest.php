<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Raffle;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TicketPurchaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_pages_render(): void
    {
        $raffle = Raffle::factory()->create(['featured' => true]);

        foreach (['/', '/raffles', "/raffles/{$raffle->slug}", '/winners', '/how-it-works', '/terms', '/privacy', '/responsible-play', '/basket', '/login'] as $url) {
            $this->get($url)->assertOk();
        }
    }

    public function test_draft_raffle_is_hidden(): void
    {
        $raffle = Raffle::factory()->create(['status' => Raffle::STATUS_DRAFT]);
        $this->get("/raffles/{$raffle->slug}")->assertNotFound();
    }

    public function test_guest_can_fill_basket_but_must_sign_in_to_pay(): void
    {
        $raffle = Raffle::factory()->create();

        $this->post('/basket', ['raffle_id' => $raffle->id, 'quantity' => 3])->assertSessionHasNoErrors();
        $this->assertSame([$raffle->id => ['qty' => 3, 'numbers' => []]], session('basket'));

        $this->post('/checkout', ['confirm_terms' => true])->assertRedirect('/login');
    }

    public function test_checkout_issues_unique_random_tickets(): void
    {
        $user = User::factory()->create();
        $a = Raffle::factory()->create(['ticket_price_cents' => 250, 'max_tickets' => 100]);
        $b = Raffle::factory()->create(['ticket_price_cents' => 1000, 'max_tickets' => 50]);

        $this->actingAs($user)
            ->post('/basket', ['raffle_id' => $a->id, 'quantity' => 10])
            ->assertSessionHasNoErrors();
        $this->post('/basket', ['raffle_id' => $b->id, 'quantity' => 2]);

        $response = $this->post('/checkout', ['confirm_terms' => true]);
        $order = Order::first();
        $response->assertRedirect("/account/orders/{$order->reference}");

        $this->assertSame('paid', $order->status);
        $this->assertSame(10 * 250 + 2 * 1000, $order->total_cents);
        $this->assertSame(10, Ticket::where('raffle_id', $a->id)->where('user_id', $user->id)->count());
        $this->assertSame(2, Ticket::where('raffle_id', $b->id)->count());

        $numbers = Ticket::where('raffle_id', $a->id)->pluck('number');
        $this->assertSame(10, $numbers->unique()->count());
        $this->assertTrue($numbers->every(fn ($n) => $n >= 1 && $n <= 100));
        $this->assertNull(session('basket'));

        $this->get("/account/orders/{$order->reference}")->assertOk();
        $this->get('/account')->assertOk();
    }

    public function test_terms_confirmation_required_at_checkout(): void
    {
        $user = User::factory()->create();
        $raffle = Raffle::factory()->create();
        $this->actingAs($user)->post('/basket', ['raffle_id' => $raffle->id, 'quantity' => 1]);
        $this->post('/checkout')->assertSessionHasErrors('confirm_terms');
        $this->assertSame(0, Ticket::count());
    }

    public function test_per_person_limit_is_enforced(): void
    {
        $user = User::factory()->create();
        $raffle = Raffle::factory()->create(['max_per_user' => 5]);

        $this->actingAs($user)->post('/basket', ['raffle_id' => $raffle->id, 'quantity' => 6])->assertSessionHasErrors('quantity');
        $this->post('/basket', ['raffle_id' => $raffle->id, 'quantity' => 5])->assertSessionHasNoErrors();
        $this->post('/checkout', ['confirm_terms' => true]);
        $this->post('/basket', ['raffle_id' => $raffle->id, 'quantity' => 1])->assertSessionHasErrors('quantity');
    }

    public function test_cannot_buy_more_than_remaining_and_sold_out_closes(): void
    {
        $user = User::factory()->create();
        $raffle = Raffle::factory()->create(['max_tickets' => 3, 'max_per_user' => 10]);

        $this->actingAs($user)->post('/basket', ['raffle_id' => $raffle->id, 'quantity' => 4])->assertSessionHasErrors('quantity');
        $this->post('/basket', ['raffle_id' => $raffle->id, 'quantity' => 3]);
        $this->post('/checkout', ['confirm_terms' => true]);

        $this->assertSame(Raffle::STATUS_CLOSED, $raffle->fresh()->status);
        $this->assertEqualsCanonicalizing([1, 2, 3], Ticket::pluck('number')->all());
    }

    public function test_closed_raffle_cannot_be_bought(): void
    {
        $user = User::factory()->create();
        $raffle = Raffle::factory()->create(['draws_at' => now()->subMinute()]);
        $this->actingAs($user)->post('/basket', ['raffle_id' => $raffle->id, 'quantity' => 1])->assertSessionHasErrors('quantity');
    }

    public function test_other_users_order_is_hidden(): void
    {
        $owner = User::factory()->create();
        $raffle = Raffle::factory()->create();
        $this->actingAs($owner)->post('/basket', ['raffle_id' => $raffle->id, 'quantity' => 1]);
        $this->post('/checkout', ['confirm_terms' => true]);
        $order = Order::first();

        $this->actingAs(User::factory()->create())->get("/account/orders/{$order->reference}")->assertNotFound();
    }
}
