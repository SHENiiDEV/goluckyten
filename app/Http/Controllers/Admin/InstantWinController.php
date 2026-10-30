<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\InstantWinPrize;
use App\Models\Raffle;
use App\Services\InstantWinService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InstantWinController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->query('status', 'pending');

        $wins = InstantWinPrize::whereNotNull('won_at')
            ->with(['user:id,name,surname,email,phone,address_line,city,post_code,country', 'raffle:id,title,slug'])
            ->when($status !== 'all', fn ($q) => $q->where('fulfilment_status', $status))
            ->latest('won_at')->paginate(30)->withQueryString();

        return Inertia::render('Admin/InstantWins', [
            'wins' => $wins->through(fn ($w) => [
                'id' => $w->id,
                'title' => $w->title,
                'type' => $w->prize_type,
                'value_cents' => $w->value_cents,
                'ticket_number' => $w->ticket_number,
                'raffle' => $w->raffle->title,
                'raffle_slug' => $w->raffle->slug,
                'user' => $w->user?->full_name,
                'email' => $w->user?->email,
                'phone' => $w->user?->phone,
                'address' => $w->user?->fullAddress(),
                'status' => $w->fulfilment_status,
                'won_at' => $w->won_at->toIso8601String(),
            ]),
            'filters' => ['status' => $status],
        ]);
    }

    public function store(Request $request, Raffle $raffle, InstantWinService $service): RedirectResponse
    {
        abort_if($raffle->status === Raffle::STATUS_DRAWN, 422, 'This raffle has been drawn.');

        $data = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'prize_type' => ['required', Rule::in([InstantWinPrize::TYPE_CASH, InstantWinPrize::TYPE_ITEM])],
            'value' => ['required', 'numeric', 'min:0.01'],
            'quantity' => ['required', 'integer', 'min:1', 'max:5000'],
            'image' => ['nullable', 'image', 'max:4096'],
        ]);

        $path = $request->file('image')?->store('instant-wins', 'public');
        $count = $service->addPrizes($raffle, $data['title'], $data['prize_type'], (int) round($data['value'] * 100), (int) $data['quantity'], $path);

        return back()->with('success', "{$count} × {$data['title']} hidden behind random ticket numbers.");
    }

    public function destroy(Raffle $raffle, Request $request): RedirectResponse
    {
        $data = $request->validate(['title' => ['required', 'string'], 'value_cents' => ['required', 'integer']]);

        $deleted = InstantWinPrize::where('raffle_id', $raffle->id)->whereNull('ticket_id')
            ->where('title', $data['title'])->where('value_cents', $data['value_cents'])->delete();

        return back()->with('success', "Removed {$deleted} unclaimed prize(s). Already won prizes are kept.");
    }

    public function fulfil(Request $request, InstantWinPrize $prize): RedirectResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(['pending', 'paid', 'shipped'])]]);
        $prize->update(['fulfilment_status' => $data['status'], 'fulfilled_at' => $data['status'] === 'pending' ? null : now()]);

        return back()->with('success', 'Prize status updated.');
    }
}
