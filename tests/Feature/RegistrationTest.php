<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'email' => 'Anna@Example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'name' => 'Anna',
            'surname' => 'Kalniņa',
            'phone' => '+371 20 123 456',
            'date_of_birth' => now()->subYears(30)->toDateString(),
            'address_line' => 'Brīvības iela 1, apt. 12',
            'city' => 'Riga',
            'country' => 'LV',
            'post_code' => 'LV-1010',
            'terms' => true,
        ], $overrides);
    }

    public function test_register_page_lists_countries_without_restricted_ones(): void
    {
        $this->get('/register')->assertOk()->assertInertia(fn ($page) => $page
            ->component('Auth/Register')
            ->where('countries', function ($countries) {
                $codes = collect($countries)->pluck('code');

                return $codes->contains('LV') && $codes->contains('DE')
                    && $codes->intersect(['SD', 'CD', 'IR', 'ML', 'MM', 'KP', 'SS', 'SY', 'YE', 'AF', 'BY', 'CF', 'CU', 'HT', 'IQ', 'RU', 'SO', 'VE', 'ZW'])->isEmpty()
                    && $codes->count() === 250 - 19;
            }));
    }

    public function test_player_can_register_with_full_details(): void
    {
        $this->post('/register', $this->payload())->assertRedirect('/account');

        $user = User::firstWhere('email', 'anna@example.com');
        $this->assertNotNull($user);
        $this->assertSame('Kalniņa', $user->surname);
        $this->assertSame('+37120123456', $user->phone);
        $this->assertSame('LV', $user->country);
        $this->assertNotNull($user->terms_accepted_at);
        $this->assertAuthenticatedAs($user);
    }

    public function test_terms_must_be_accepted(): void
    {
        $this->post('/register', $this->payload(['terms' => false]))->assertSessionHasErrors('terms');
        $this->assertGuest();
    }

    public function test_restricted_country_is_rejected(): void
    {
        foreach (['RU', 'BY', 'IR', 'KP'] as $code) {
            $this->post('/register', $this->payload(['country' => $code]))->assertSessionHasErrors('country');
        }
        $this->assertSame(0, User::count());
    }

    public function test_under_18_is_rejected(): void
    {
        $this->post('/register', $this->payload(['date_of_birth' => now()->subYears(17)->toDateString()]))
            ->assertSessionHasErrors('date_of_birth');
    }

    public function test_all_address_parts_are_required(): void
    {
        $this->post('/register', $this->payload(['address_line' => '', 'city' => '', 'post_code' => '', 'country' => '']))
            ->assertSessionHasErrors(['address_line', 'city', 'post_code', 'country']);
    }

    public function test_login_and_logout(): void
    {
        $user = User::factory()->create(['email' => 'p@example.com']);

        $this->post('/login', ['email' => 'p@example.com', 'password' => 'wrong'])->assertSessionHasErrors('email');
        $this->post('/login', ['email' => 'p@example.com', 'password' => 'password'])->assertRedirect('/account');
        $this->assertAuthenticatedAs($user);
        $this->post('/logout')->assertRedirect('/');
        $this->assertGuest();
    }
}
