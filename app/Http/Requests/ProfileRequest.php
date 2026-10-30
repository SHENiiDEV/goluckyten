<?php

namespace App\Http\Requests;

use App\Support\Countries;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileRequest extends FormRequest
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
        return [
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->user()->id)],
            'name' => ['required', 'string', 'max:80'],
            'surname' => ['required', 'string', 'max:80'],
            'phone' => ['required', 'string', 'regex:/^\+?\d{7,15}$/'],
            'address_line' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:120'],
            'country' => ['required', 'string', Rule::in(array_keys(Countries::allowed()))],
            'post_code' => ['required', 'string', 'max:20'],
            'profile_public' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.regex' => 'Enter a phone number with country code, e.g. +371 20 000 000.',
            'country.in' => 'We can’t accept players from this country.',
        ];
    }
}
