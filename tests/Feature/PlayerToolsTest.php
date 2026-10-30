<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\PromoCode;
use App\Models\Raffle;
use App\Models\Ticket;
use App\Models\User;
use App\Models\WithdrawalRequest;
use App\Services\DrawService;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PlayerToolsTest extends TestCase
{
    use RefreshDatabase;

    private function buy(User $user, Raffle $raffle, int $qty, array $extra = [], array $checkout = [])
    {
        $this->actingAs($user)->post('/basket', ['raffle_id' => $raffle->id, 'quantity' => $qty, ...$extra])->assertSessionHasNoErrors();

        return $this->post('/checkout', ['confirm_terms' => true, ...$checkout]);
    }

    public function test_new_pages_render(): void
    {
        $user = User::factory()->create();
        $raffle = Raffle::factory()->create();
        $this->get('/cookies')->assertOk();
        $this->get("/raffles/{$raffle->slug}/live")->assertOk();
        foreach (['/account/wallet', '/account/referrals', '/account/safer-play', '/account/notifications', '/account/notifications/recent'] as $url) {
            $this->actingAs($user)->get($url)->assertOk();
        }
    }

    public function test_order_gets_invoice_number_email_and_downloadable_invoice(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $this->buy($user, Raffle::factory()->create(), 4);

        $order = Order::first();
        $this->assertMatchesRegularExpression('/^LT-\d{4}-\d{6}$/', $order->invoice_number);
        Mail::assertSent(\App\Mail\OrderConfirmed::class);

        $res = $this->get("/account/orders/{$order->reference}/invoice")->assertOk();
        $this->assertStringStartsWith('%PDF', $res->getContent());

        $this->actingAs(User::factory()->create())->get("/account/orders/{$order->reference}/invoice")->assertNotFound();
    }

    public function test_promo_code_discounts_and_is_single_use(): void
    {
        $user = User::factory()->create();
        $raffle = Raffle::factory()->create(['ticket_price_cents' => 100]);
        PromoCode::create(['code' => 'TEN', 'type' => 'percent', 'value' => 10, 'per_user_limit' => 1]);

        $this->actingAs($user)->post('/basket', ['raffle_id' => $raffle->id, 'quantity' => 10]);
        $this->post('/basket/promo', ['promo_code' => 'ten'])->assertSessionHasNoErrors();
        $this->post('/checkout', ['confirm_terms' => true]);

        $order = Order::first();
        $this->assertSame(1000, $order->subtotal_cents);
        $this->assertSame(100, $order->discount_cents);
        $this->assertSame(900, $order->total_cents);

        $this->post('/basket', ['raffle_id' => $raffle->id, 'quantity' => 1]);
        $this->post('/basket/promo', ['promo_code' => 'TEN'])->assertSessionHasErrors('promo_code');
    }

    public function test_flash_sale_price_is_charged(): void
    {
        $raffle = Raffle::factory()->create(['ticket_price_cents' => 100, 'sale_price_cents' => 50, 'sale_ends_at' => now()->addDay()]);
        $this->buy(User::factory()->create(), $raffle, 4);
        $this->assertSame(200, Order::first()->total_cents);
    }

    public function test_wallet_pays_for_tickets_and_withdrawal_is_debited(): void
    {
        $user = User::factory()->create();
        app(WalletService::class)->credit($user, 2000, 'adjustment', 'Test credit');
        $raffle = Raffle::factory()->create(['ticket_price_cents' => 100]);

        $this->buy($user, $raffle, 5, [], ['use_wallet' => true]);
        $order = Order::first();
        $this->assertSame(500, $order->wallet_cents);
        $this->assertSame('wallet', $order->payment_method);
        $this->assertSame(1500, $user->fresh()->wallet_balance_cents);

        $this->post('/account/wallet/withdraw', ['amount' => 15, 'account_name' => 'Anna K', 'iban' => 'LV80BANK0000435195001'])->assertSessionHasNoErrors();
        $this->assertSame(0, $user->fresh()->wallet_balance_cents);
        $this->assertSame(1, WithdrawalRequest::count());

        $this->post('/account/wallet/withdraw', ['amount' => 10, 'account_name' => 'Anna K', 'iban' => 'LV80BANK0000435195001'])->assertSessionHasErrors('wallet');
    }

    public function test_rejected_withdrawal_is_refunded(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create();
        app(WalletService::class)->credit($user, 1500, 'adjustment', 'x');
        $this->actingAs($user)->post('/account/wallet/withdraw', ['amount' => 15, 'account_name' => 'A', 'iban' => 'LV80BANK0000435195001']);

        $this->actingAs($admin)->post('/admin/withdrawals/'.WithdrawalRequest::first()->id.'/reject', ['note' => 'Name mismatch']);
        $this->assertSame(1500, $user->fresh()->wallet_balance_cents);
    }

    public function test_spend_limit_blocks_and_loosening_waits(): void
    {
        $user = User::factory()->create();
        $raffle = Raffle::factory()->create(['ticket_price_cents' => 100]);
        $this->actingAs($user)->post('/account/safer-play/limit', ['amount' => 3, 'period' => 'day']);
        $this->assertSame(300, $user->fresh()->spend_limit_cents);

        $this->buy($user, $raffle, 5)->assertSessionHasErrors('basket');
        $this->assertSame(0, Order::count());

        $this->post('/account/safer-play/limit', ['amount' => 50, 'period' => 'day']);
        $this->assertSame(300, $user->fresh()->spend_limit_cents);
        $this->assertNotNull($user->fresh()->pending_spend_limit_at);

        $this->travel(25)->hours();
        $this->get('/account/safer-play');
        $this->assertSame(5000, $user->fresh()->spend_limit_cents);
    }

    public function test_self_exclusion_blocks_entries(): void
    {
        $user = User::factory()->create();
        $raffle = Raffle::factory()->create();
        $this->actingAs($user)->post('/account/safer-play/exclude', ['length' => '1w', 'password' => 'password'])->assertSessionHasNoErrors();
        $this->assertTrue($user->fresh()->isExcluded());

        $this->post('/basket', ['raffle_id' => $raffle->id, 'quantity' => 1])->assertSessionHasErrors('quantity');
    }

    public function test_referral_rewards_both_players_once(): void
    {
        $referrer = User::factory()->create();
        $this->get("/r/{$referrer->referral_code}")->assertRedirect('/register')->assertCookie('lt_ref');

        $friend = User::factory()->create(['referred_by_id' => $referrer->id]);
        $raffle = Raffle::factory()->create(['ticket_price_cents' => 100]);
        $this->buy($friend, $raffle, 2);
        $this->buy($friend, $raffle, 2);

        $this->assertSame(100, $referrer->fresh()->wallet_balance_cents);
        $this->assertSame(100, $friend->fresh()->wallet_balance_cents);
        $this->assertSame(1, $referrer->notifications()->count());
    }

    public function test_pick_your_numbers(): void
    {
        $user = User::factory()->create();
        $raffle = Raffle::factory()->create(['max_tickets' => 500]);

        $this->actingAs($user)->getJson("/raffles/{$raffle->slug}/numbers?check=7,600&suggest=3")
            ->assertJson(['taken' => [], 'out_of_range' => [600]])->assertJsonCount(3, 'suggestions');

        $this->buy($user, $raffle, 3, ['numbers' => [7, 77]]);
        $numbers = Ticket::where('user_id', $user->id)->pluck('number')->all();
        $this->assertContains(7, $numbers);
        $this->assertContains(77, $numbers);
        $this->assertCount(3, $numbers);

        $other = User::factory()->create();
        $this->actingAs($other)->post('/basket', ['raffle_id' => $raffle->id, 'quantity' => 1, 'numbers' => [7]])->assertSessionHasErrors('numbers');
    }

    public function test_draw_is_reproducible_and_seed_hidden_until_drawn(): void
    {
        $user = User::factory()->create();
        $raffle = Raffle::factory()->create(['max_tickets' => 100, 'max_per_user' => 100]);
        $this->buy($user, $raffle, 30);

        $live = $this->getJson("/raffles/{$raffle->slug}/live/status")->assertOk()->json();
        $this->assertNull($live['seed']);
        $this->assertSame(hash('sha256', $raffle->fresh()->draw_seed), $live['seed_hash']);
        $this->assertStringNotContainsString($raffle->fresh()->draw_seed, $this->get("/raffles/{$raffle->slug}")->getContent());

        $winner = app(DrawService::class)->draw($raffle->fresh());
        $state = $this->getJson("/raffles/{$raffle->slug}/live/status")->json();

        $numbers = Ticket::where('raffle_id', $raffle->id)->orderBy('number')->pluck('number')->all();
        $index = hexdec(substr(hash_hmac('sha256', "{$raffle->id}:30", $state['seed']), 0, 13)) % 30;
        $this->assertSame($numbers[$index], $winner->number);
        $this->assertSame($winner->number, $state['winner']['number']);
        $this->assertSame(30, count(array_filter(explode("\n", $this->get("/raffles/{$raffle->slug}/live/tickets.txt")->streamedContent()))));
    }

    public function test_auto_draw_runs_when_due(): void
    {
        $raffle = Raffle::factory()->create(['max_tickets' => 100, 'max_per_user' => 100]);
        $this->buy(User::factory()->create(), $raffle, 10);
        $raffle->update(['draws_at' => now()->subMinute()]);

        $this->artisan('raffles:auto-draw')->assertSuccessful();
        $this->assertSame(Raffle::STATUS_DRAWN, $raffle->fresh()->status);
    }

    public function test_draw_reminder_and_new_competition_notifications(): void
    {
        $user = User::factory()->create(['favourite_categories' => ['cars']]);
        $raffle = Raffle::factory()->create(['draws_at' => now()->addHours(10), 'category' => 'watches']);
        $this->buy($user, $raffle, 1);

        $this->artisan('raffles:remind')->assertSuccessful();
        $this->artisan('raffles:remind')->assertSuccessful();
        $this->assertSame(1, $user->notifications()->where('data', 'like', '%drawn tomorrow%')->count());

        Raffle::factory()->create(['category' => 'cars']);
        $this->assertSame(1, $user->notifications()->where('data', 'like', '%New:%')->count());
    }

    public function test_repeat_order_refills_basket(): void
    {
        $user = User::factory()->create();
        $raffle = Raffle::factory()->create();
        $this->buy($user, $raffle, 3);
        $order = Order::first();

        $this->post("/account/orders/{$order->reference}/repeat")->assertRedirect('/basket');
        $this->assertSame(3, session('basket')[$raffle->id]['qty']);
    }

    public function test_gdpr_export_and_delete(): void
    {
        $user = User::factory()->create(['email' => 'anna@example.com']);
        $this->buy($user, Raffle::factory()->create(), 2);

        $json = json_decode($this->get('/account/data-export')->assertOk()->streamedContent(), true);
        $this->assertSame('anna@example.com', $json['profile']['email']);
        $this->assertCount(2, $json['tickets']);

        $this->delete('/account', ['password' => 'password', 'confirm' => 'DELETE'])->assertRedirect('/');
        $this->assertGuest();
        $fresh = $user->fresh();
        $this->assertNotNull($fresh->anonymised_at);
        $this->assertStringEndsWith('@deleted.invalid', $fresh->email);
        $this->assertSame(2, Ticket::where('user_id', $user->id)->count());
    }

    public function test_account_with_wallet_balance_cannot_be_deleted(): void
    {
        $user = User::factory()->create();
        app(WalletService::class)->credit($user, 500, 'adjustment', 'x');
        $this->actingAs($user)->delete('/account', ['password' => 'password', 'confirm' => 'DELETE'])->assertSessionHasErrors('password');
        $this->assertNull($user->fresh()->anonymised_at);
    }

    public function test_admin_manages_promo_codes(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $this->actingAs($admin)->post('/admin/promo-codes', ['code' => 'summer5', 'type' => 'fixed', 'value' => 5, 'per_user_limit' => 1, 'active' => true])->assertSessionHasNoErrors();
        $this->assertSame(500, PromoCode::where('code', 'SUMMER5')->value('value'));
        $this->get('/admin/promo-codes')->assertOk();
        $this->get('/admin/withdrawals')->assertOk();
    }
}
