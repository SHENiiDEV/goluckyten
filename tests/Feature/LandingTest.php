<?php

namespace Tests\Feature;

use App\Models\Raffle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LandingTest extends TestCase
{
    use RefreshDatabase;

    public function test_landing_renders_with_real_data_only(): void
    {
        Raffle::factory()->create(['featured' => true]);

        $this->get('/landing')->assertOk()->assertInertia(fn ($page) => $page
            ->component('Landing')
            ->has('featured')
            ->where('stats.tickets', 0)
            ->has('stories', 0));
    }

    public function test_landing_works_with_no_raffles(): void
    {
        $this->get('/landing')->assertOk()->assertInertia(fn ($page) => $page->where('featured', null));
    }
}
