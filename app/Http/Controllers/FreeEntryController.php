<?php

namespace App\Http\Controllers;

use App\Mail\FreeEntryReceived;
use App\Mail\FreeEntrySubmitted;
use App\Models\FreeEntryRequest;
use App\Models\Raffle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FreeEntryController extends Controller
{
    public function create(Request $request): Response
    {
        $user = $request->user();
        $used = $user->freeEntryRequests()->pluck('raffle_id')->all();

        $raffles = Raffle::live()->withCardCounts()->where('free_entry_enabled', true)
            ->orderBy('draws_at')->get()
            ->filter->isOpen()
            ->map(fn ($r) => [...$r->toCard(), 'already_requested' => in_array($r->id, $used)])
            ->values();

        return Inertia::render('FreeEntry', [
            'raffles' => $raffles,
            'selected' => $request->query('raffle'),
            'prefill' => [
                'full_name' => $user->full_name,
                'email' => $user->email,
                'address' => $user->fullAddress(),
            ],
            'requests' => $user->freeEntryRequests()->with('raffle:id,title,slug')->latest()->get()
                ->map(fn ($f) => [
                    'reference' => $f->reference,
                    'status' => $f->status,
                    'raffle' => $f->raffle?->title,
                    'raffle_slug' => $f->raffle?->slug,
                    'created_at' => $f->created_at->toIso8601String(),
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'raffle_id' => [
                'required', 'integer',
                Rule::exists('raffles', 'id')->where('free_entry_enabled', true)->where('status', Raffle::STATUS_LIVE),
                Rule::unique('free_entry_requests', 'raffle_id')->where('user_id', $user->id),
            ],
            'full_name' => ['required', 'string', 'max:160'],
            'email' => ['required', 'email', 'max:255'],
            'address' => ['required', 'string', 'max:500'],
            'statement' => ['required', 'string', 'min:20', 'max:1000'],
            'confirm' => ['accepted'],
        ], [
            'raffle_id.unique' => 'You’ve already sent a free entry request for this raffle. One free entry per person per raffle.',
            'raffle_id.exists' => 'This raffle isn’t accepting free entries right now.',
            'statement.min' => 'Write a short sentence in your own words (at least 20 characters).',
            'confirm.accepted' => 'Please confirm the details are correct and you’ve read the free entry rules.',
        ]);

        $raffle = Raffle::withCardCounts()->findOrFail($data['raffle_id']);
        abort_unless($raffle->isOpen(), 422, 'This raffle is closed.');

        $entry = FreeEntryRequest::create([
            ...collect($data)->except('confirm')->all(),
            'reference' => 'FE-'.strtoupper(Str::random(8)),
            'user_id' => $user->id,
            'status' => FreeEntryRequest::STATUS_PENDING,
        ]);
        $entry->setRelation('raffle', $raffle)->setRelation('user', $user);

        Mail::to(config('company.free_entry_email'))->send(new FreeEntryReceived($entry));
        Mail::to($entry->email)->send(new FreeEntrySubmitted($entry));

        return redirect()->route('free-entry')->with('success', "Request {$entry->reference} sent. We’ll email you once your free ticket is issued.");
    }
}
