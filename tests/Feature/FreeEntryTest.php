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
            'full_name' => 'Anna Kalnina',
            'email' => 'anna@example.com',
            'address' => 'Brivibas iela 1, Riga, LV-1010, Latvia',
            'statement' => 'I would like to enter this raffle for free please.',
            'confirm' => true,
        ]);
    }

    public function test_free_entry_requires_login(): void
    {
        $this->get('/free-entry')->assertRedirect('/login');
    }

    public function test_request_is_stored_and_emailed(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $raffle = Raffle::factory()->create();

        $this->submit($user, $raffle)->assertRedirect('/free-entry')->assertSessionHasNoErrors();

        $entry = FreeEntryRequest::first();
        $this->assertSame('pending', $entry->status);
        $this->assertSame(0, Ticket::count());
        Mail::assertSent(FreeEntryReceived::class, fn ($m) => $m->hasTo(config('company.free_entry_email')));
        Mail::assertSent(FreeEntrySubmitted::class, fn ($m) => $m->hasTo('anna@example.com'));
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
}
