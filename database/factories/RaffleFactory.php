<?php

namespace Database\Factories;

use App\Models\Raffle;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Raffle>
 */
class RaffleFactory extends Factory
{
    public function definition(): array
    {
        $title = ucfirst(fake()->unique()->words(3, true));

        return [
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(4)),
            'title' => $title,
            'subtitle' => fake()->sentence(6),
            'description' => fake()->paragraphs(2, true),
            'highlights' => ['Brand new', 'Free delivery'],
            'category' => fake()->randomElement(array_keys(Raffle::CATEGORIES)),
            'retail_value_cents' => 500000,
            'cash_alternative_cents' => 400000,
            'ticket_price_cents' => 250,
            'max_tickets' => 1000,
            'max_per_user' => 50,
            'free_entry_enabled' => true,
            'featured' => false,
            'status' => Raffle::STATUS_LIVE,
            'draws_at' => now()->addDays(7),
        ];
    }
}
