<?php

namespace App\Http\Requests;

use App\Support\Countries;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => strtolower(trim((string) $this->input('email'))),
            'phone' => preg_replace('/[^\d+]/', '', (string) $this->input('phone')),
        ]);
    }

    public function rules(): array
    {
        $minAge = config('company.min_age');

        return [
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
            'name' => ['required', 'string', 'max:80'],
            'surname' => ['required', 'string', 'max:80'],
            'phone' => ['required', 'string', 'regex:/^\+?\d{7,15}$/'],
            'date_of_birth' => ['required', 'date', 'before_or_equal:'.now()->subYears($minAge)->toDateString(), 'after:1900-01-01'],
            'address_line' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:120'],
            'country' => ['required', 'string', Rule::in(array_keys(Countries::allowed()))],
            'post_code' => ['required', 'string', 'max:20'],
            'terms' => ['accepted'],
            'profile_public' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'date_of_birth.before_or_equal' => 'You must be at least '.config('company.min_age').' years old to play.',
            'phone.regex' => 'Enter a phone number with country code, e.g. +371 20 000 000.',
            'country.in' => 'We can’t accept players from this country.',
            'terms.accepted' => 'Please accept the Terms & Conditions and Privacy Policy to continue.',
            'address_line.required' => 'Enter your street, house number and apartment.',
        ];
    }
}
