# Raffle Lottery — notes for agents

Laravel 13 + Inertia v3 + React 19 (JSX) + Tailwind 4. See README.md.

- Pages: resources/js/Pages (Inertia), layouts in resources/js/Layouts, shared UI in resources/js/Components.
- Design tokens live in resources/css/app.css (@theme): ink/panel/line/cream/mist, violet (brand), amber (money), hot (urgency), jade. Font: Archivo variable (width axis) via @fontsource; .font-display / .font-wide / .font-strip set width+weight.
- Motion follows the skills in .claude/skills (emil-design-eng, animate, review-animations): tokens --ease-out / --ease-in-out / --ease-drawer (Tailwind's ease-out/ease-in-out use them), UI motion under 300ms, transform/opacity only, press feedback via .btn or .pressable, toasts use transitions + @starting-style, reduced motion = gentler fades, never zero.
- Money is stored in integer cents. Currency from config('company.currency').
- Ticket numbers: App\Services\TicketAllocator (call inside a transaction with the raffle locked).
- Payments: App\Services\Payments\PaymentGateway, currently StubGateway.
- Countries: config/countries.php ('all' + 'restricted'); App\Support\Countries::allowed().
- Run tests with `php artisan test`.
