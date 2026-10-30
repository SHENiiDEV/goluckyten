<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->firstName(),
            'surname' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'phone' => '+3712'.fake()->numerify('#######'),
            'date_of_birth' => fake()->dateTimeBetween('-70 years', '-19 years')->format('Y-m-d'),
            'address_line' => fake()->streetAddress(),
            'city' => fake()->randomElement(['Riga', 'Tallinn', 'Vilnius', 'Berlin', 'Lisbon', 'Dublin', 'Warsaw', 'Prague']),
            'country' => fake()->randomElement(['LV', 'EE', 'LT', 'DE', 'PT', 'IE', 'PL', 'CZ']),
            'post_code' => fake()->postcode(),
            'terms_accepted_at' => now(),
            'profile_public' => fake()->boolean(75),
            'remember_token' => Str::random(10),
        ];
    }

    public function admin(): static
    {
        return $this->state(fn () => ['is_admin' => true]);
    }
}
