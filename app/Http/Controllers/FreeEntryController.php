<?php

namespace App\Http\Controllers;

use App\Mail\FreeEntrySubmitted;
use App\Models\FreeEntryRequest;
use App\Models\Raffle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FreeEntryController extends Controller
{
    public function create(Request $request): Response
    {
        $user = $request->user();
        $used = $user ? $user->freeEntryRequests()->pluck('raffle_id')->all() : [];

        $raffles = Raffle::live()->withCardCounts()->where('free_entry_enabled', true)
            ->orderBy('draws_at')->get()
            ->filter->isOpen()
            ->map(fn ($r) => [...$r->toCard(), 'already_requested' => in_array($r->id, $used)])
            ->values();

        return Inertia::render('FreeEntry', [
            'justIssued' => $request->session()->get('free_entry_code'),
            'raffles' => $raffles,
            'selected' => $request->query('raffle'),
            'prefill' => $user ? [
                'full_name' => $user->full_name,
                'email' => $user->email,
                'address' => $user->fullAddress(),
            ] : null,
            'excludedUntil' => $user?->isExcluded() ? $user->excluded_until->toIso8601String() : null,
            'mailTo' => config('company.free_entry_email'),
            'requests' => $user ? $user->freeEntryRequests()->with('raffle:id,title,slug,image_path,category,draws_at,status')->latest()->get()
                ->map(fn ($f) => [
                    'reference' => $f->reference,
                    'status' => $f->status,
                    'subject' => $f->emailSubject(),
                    'template' => $f->emailTemplate(),
                    'draws_at' => $f->raffle?->draws_at?->toIso8601String(),
                    'raffle' => $f->raffle?->title,
                    'raffle_slug' => $f->raffle?->slug,
                    'image_url' => $f->raffle?->imageUrl(),
                    'category' => $f->raffle?->category,
                    'created_at' => $f->created_at->toIso8601String(),
                    'updated_at' => $f->updated_at->toIso8601String(),
                ]) : [],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        if ($user->isExcluded()) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'raffle_id' => 'You’re on a break until '.$user->excluded_until->format('j F Y').', so you can’t enter competitions right now.',
            ]);
        }

        $data = $request->validate([
            'raffle_id' => [
                'required', 'integer',
                Rule::exists('raffles', 'id')->where('free_entry_enabled', true)->where('status', Raffle::STATUS_LIVE),
                Rule::unique('free_entry_requests', 'raffle_id')->where('user_id', $user->id),
            ],
            'confirm' => ['accepted'],
        ], [
            'raffle_id.unique' => 'You’ve already sent a free entry request for this raffle. One free entry per person per raffle.',
            'raffle_id.exists' => 'This raffle isn’t accepting free entries right now.',
            'confirm.accepted' => 'Please confirm you’ve read the free entry rules.',
        ]);

        $raffle = Raffle::withCardCounts()->findOrFail($data['raffle_id']);
        abort_unless($raffle->isOpen(), 422, 'This raffle is closed.');

        // Account details are stored so we can compare them with the email the player sends.
        $entry = FreeEntryRequest::create([
            'raffle_id' => $raffle->id,
            'reference' => FreeEntryRequest::newCode(),
            'user_id' => $user->id,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'address' => $user->fullAddress(),
            'status' => FreeEntryRequest::STATUS_AWAITING_EMAIL,
        ]);
        $entry->setRelation('raffle', $raffle)->setRelation('user', $user);

        // The player gets the code and the template by email too, in case they close the page.
        try {
            Mail::to($user->email)->send(new FreeEntrySubmitted($entry));
        } catch (\Throwable $e) {
            report($e);
        }

        return redirect()->route('free-entry')
            ->with('success', "Your entry code is {$entry->reference}. Now send us the email below.")
            ->with('free_entry_code', $entry->reference);
    }
}
