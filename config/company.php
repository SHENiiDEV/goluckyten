<?php

return [
    'name' => env('COMPANY_NAME', 'GoLuckyTen Ltd'),
    'number' => env('COMPANY_NUMBER', '00000000'),
    'address' => env('COMPANY_ADDRESS', '1 Example Street, Riga, LV-1010, Latvia'),
    'email' => env('COMPANY_EMAIL', 'support@goluckyten.com'),

    // Where free entry (no purchase necessary) requests are sent.
    'free_entry_email' => env('FREE_ENTRY_EMAIL', env('COMPANY_EMAIL', 'freeentry@goluckyten.com')),

    'currency' => env('APP_CURRENCY', 'EUR'),

    // Ticket economics: default ticket price, and how many times the prize value the
    // full ticket pool should raise (€100 prize × 10 = €1,000 = 10,000 tickets at €0.10).
    'ticket_price_cents' => (int) env('TICKET_PRICE_CENTS', 10),
    'ticket_value_multiplier' => (float) env('TICKET_VALUE_MULTIPLIER', 10),
    // Serve the marketing landing page at / instead of the competitions home.
    'landing_as_home' => (bool) env('LANDING_AS_HOME', false),

    // Invoices
    'invoice_prefix' => env('INVOICE_PREFIX', 'LT'),
    'vat_number' => env('COMPANY_VAT_NUMBER'),          // shown on invoices when set
    'vat_rate' => (float) env('COMPANY_VAT_RATE', 0),   // % included in prices; 0 = no VAT line

    // Wallet & referrals
    'referral_bonus_cents' => (int) env('REFERRAL_BONUS_CENTS', 100),
    'referral_min_spend_cents' => (int) env('REFERRAL_MIN_SPEND_CENTS', 100),
    'withdrawal_min_cents' => (int) env('WITHDRAWAL_MIN_CENTS', 1000),

    // Web push (generate with: php artisan push:vapid)
    'vapid_public_key' => env('VAPID_PUBLIC_KEY'),
    'vapid_private_key' => env('VAPID_PRIVATE_KEY'),
    'vapid_subject' => env('VAPID_SUBJECT', 'mailto:'.env('COMPANY_EMAIL', 'support@goluckyten.com')),

    'min_age' => (int) env('MIN_PLAYER_AGE', 18),
];
