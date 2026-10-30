<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PromoCode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PromoCodeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/PromoCodes', [
            'codes' => PromoCode::latest()->get()->map(fn ($p) => [
                'id' => $p->id,
                'code' => $p->code,
                'type' => $p->type,
                'value' => $p->value,
                'label' => $p->label(),
                'min_spend_cents' => $p->min_spend_cents,
                'max_uses' => $p->max_uses,
                'uses_count' => $p->uses_count,
                'per_user_limit' => $p->per_user_limit,
                'starts_at' => $p->starts_at?->format('Y-m-d\TH:i'),
                'ends_at' => $p->ends_at?->format('Y-m-d\TH:i'),
                'active' => $p->active,
                'discount_total_cents' => (int) $p->redemptions()->sum('discount_cents'),
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        PromoCode::create($this->validated($request));

        return back()->with('success', 'Promo code created.');
    }

    public function update(Request $request, PromoCode $promo): RedirectResponse
    {
        $promo->update($this->validated($request, $promo));

        return back()->with('success', 'Promo code saved.');
    }

    public function destroy(PromoCode $promo): RedirectResponse
    {
        $promo->redemptions()->exists() ? $promo->update(['active' => false]) : $promo->delete();

        return back()->with('success', 'Promo code removed.');
    }

    private function validated(Request $request, ?PromoCode $promo = null): array
    {
        $request->merge(['code' => strtoupper(trim((string) $request->input('code')))]);
        $data = $request->validate([
            'code' => ['required', 'alpha_dash', 'max:32', Rule::unique('promo_codes', 'code')->ignore($promo?->id)],
            'type' => ['required', Rule::in(['percent', 'fixed'])],
            'value' => ['required', 'numeric', 'min:0.01'],
            'min_spend' => ['nullable', 'numeric', 'min:0'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'per_user_limit' => ['required', 'integer', 'min:1', 'max:100'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'active' => ['boolean'],
        ]);
        if ($data['type'] === 'percent' && $data['value'] > 100) {
            throw \Illuminate\Validation\ValidationException::withMessages(['value' => 'A percentage can’t be over 100.']);
        }

        return [
            'code' => $data['code'],
            'type' => $data['type'],
            'value' => $data['type'] === 'percent' ? (int) $data['value'] : (int) round($data['value'] * 100),
            'min_spend_cents' => (int) round(($data['min_spend'] ?? 0) * 100),
            'max_uses' => $data['max_uses'] ?? null,
            'per_user_limit' => $data['per_user_limit'],
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
            'active' => $request->boolean('active', true),
        ];
    }
}
