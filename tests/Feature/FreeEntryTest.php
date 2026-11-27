<?php

namespace Tests\Feature;

use App\Mail\FreeEntryDecision;
use App\Mail\FreeEntryReceived;
use App\Mail\FreeEntrySubmitted;
use App\Models\FreeEntryRequest;
use App\Models\Raffle;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class FreeEntryTest extends TestCase
{
    use RefreshDatabase;

    private function submit(User $user, Raffle $raffle)
    {
        return $this->actingAs($user)->post('/free-entry', [
            'raffle_id' => $raffle->id,
            'confirm' => true,
        ]);
    }

    public function test_free_entry_page_is_public_but_sending_needs_login(): void
    {
        $this->get('/free-entry')->assertOk();
        $this->post('/free-entry', [])->assertRedirect('/login');
    }

    public function test_code_is_issued_with_email_template(): void
    {
        Mail::fake();
        $user = User::factory()->create(['email' => 'anna@example.com']);
        $raffle = Raffle::factory()->create(['title' => 'Porsche Taycan 4S']);

        $this->submit($user, $raffle)->assertRedirect('/free-entry')->assertSessionHasNoErrors()->assertSessionHas('free_entry_code');

        $entry = FreeEntryRequest::first();
        $this->assertSame('awaiting_email', $entry->status);
        $this->assertMatchesRegularExpression('/^FE-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/', $entry->reference);
        $this->assertSame('anna@example.com', $entry->email);
        $this->assertSame(0, Ticket::count());
        $this->assertStringContainsString($entry->reference, $entry->emailTemplate());
        $this->assertStringContainsString('Porsche Taycan 4S', $entry->emailSubject());
        Mail::assertSent(FreeEntrySubmitted::class, fn ($m) => $m->hasTo('anna@example.com'));
        Mail::assertNotSent(\App\Mail\FreeEntryReceived::class);

        $page = $this->get('/free-entry')->assertOk();
        $this->assertStringContainsString($entry->reference, $page->getContent());
    }

    public function test_admin_finds_code_marks_email_received_then_approves(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $raffle = Raffle::factory()->create();
        $this->submit($user, $raffle);
        $entry = FreeEntryRequest::first();

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)->get('/admin/free-entries?code='.$entry->reference)->assertOk()->assertSee($entry->reference);
        $this->post("/admin/free-entries/{$entry->id}/received", ['statement' => 'I would like to enter for free.'])->assertSessionHasNoErrors();
        $this->assertSame('pending', $entry->fresh()->status);
        $this->assertNotNull($entry->fresh()->email_received_at);

        $this->post("/admin/free-entries/{$entry->id}/approve")->assertSessionHasNoErrors();
        $this->assertSame('approved', $entry->fresh()->status);
        $this->assertSame('I would like to enter for free.', $entry->fresh()->statement);
        $this->assertSame(1, Ticket::where('entry_type', 'free')->count());
    }

    public function test_one_free_entry_per_person_per_raffle(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $raffle = Raffle::factory()->create();

        $this->submit($user, $raffle);
        $this->submit($user, $raffle)->assertSessionHasErrors('raffle_id');
        $this->assertSame(1, FreeEntryRequest::count());
    }

    public function test_disabled_free_entry_is_rejected(): void
    {
        $raffle = Raffle::factory()->create(['free_entry_enabled' => false]);
        $this->submit(User::factory()->create(), $raffle)->assertSessionHasErrors('raffle_id');
    }

    public function test_admin_approval_issues_one_free_ticket(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $raffle = Raffle::factory()->create();
        $this->submit($user, $raffle);
        $entry = FreeEntryRequest::first();

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)->post("/admin/free-entries/{$entry->id}/approve")->assertSessionHasNoErrors();

        $ticket = Ticket::first();
        $this->assertSame('free', $ticket->entry_type);
        $this->assertSame($user->id, $ticket->user_id);
        $this->assertSame($entry->id, $ticket->free_entry_request_id);
        $this->assertSame('approved', $entry->fresh()->status);
        Mail::assertSent(FreeEntryDecision::class);

        // Approving twice does nothing.
        $this->post("/admin/free-entries/{$entry->id}/approve")->assertSessionHasErrors('request');
        $this->assertSame(1, Ticket::count());
    }

    public function test_admin_can_reject_with_reason(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $raffle = Raffle::factory()->create();
        $this->submit($user, $raffle);
        $entry = FreeEntryRequest::first();

        $this->actingAs(User::factory()->admin()->create())
            ->post("/admin/free-entries/{$entry->id}/reject", ['admin_note' => 'Duplicate account'])
            ->assertSessionHasNoErrors();

        $this->assertSame('rejected', $entry->fresh()->status);
        $this->assertSame(0, Ticket::count());
    }

    public function test_self_excluded_player_cannot_request_free_entry(): void
    {
        $user = User::factory()->create(['excluded_until' => now()->addWeek()]);
        $raffle = Raffle::factory()->create();
        $this->submit($user, $raffle)->assertSessionHasErrors('raffle_id');
        $this->assertSame(0, FreeEntryRequest::count());
    }
}
