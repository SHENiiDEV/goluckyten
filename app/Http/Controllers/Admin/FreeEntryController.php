<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\FreeEntryDecision;
use App\Models\FreeEntryRequest;
use App\Models\Raffle;
use App\Models\Ticket;
use App\Services\TicketAllocator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class FreeEntryController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->query('status', FreeEntryRequest::STATUS_PENDING);

        $requests = FreeEntryRequest::with(['raffle:id,title,slug,status', 'user:id,name,surname,email', 'ticket:id,free_entry_request_id,number'])
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->latest()->paginate(25)->withQueryString();

        return Inertia::render('Admin/FreeEntries', [
            'requests' => $requests->through(fn ($f) => [
                'id' => $f->id,
                'reference' => $f->reference,
                'status' => $f->status,
                'full_name' => $f->full_name,
                'email' => $f->email,
                'address' => $f->address,
                'statement' => $f->statement,
                'admin_note' => $f->admin_note,
                'account' => $f->user->full_name.' <'.$f->user->email.'>',
                'raffle' => $f->raffle->title,
                'raffle_slug' => $f->raffle->slug,
                'raffle_status' => $f->raffle->status,
                'ticket_number' => $f->ticket?->number,
                'created_at' => $f->created_at->toIso8601String(),
            ]),
            'filters' => ['status' => $status],
            'counts' => FreeEntryRequest::selectRaw('status, count(*) as c')->groupBy('status')->pluck('c', 'status'),
        ]);
    }

    public function approve(FreeEntryRequest $freeEntry, TicketAllocator $allocator): RedirectResponse
    {
        $ticket = DB::transaction(function () use ($freeEntry, $allocator) {
            $entry = FreeEntryRequest::lockForUpdate()->findOrFail($freeEntry->id);
            if ($entry->status !== FreeEntryRequest::STATUS_PENDING) {
                throw ValidationException::withMessages(['request' => 'This request has already been processed.']);
            }
            $raffle = Raffle::lockForUpdate()->findOrFail($entry->raffle_id);
            if ($raffle->status !== Raffle::STATUS_LIVE || $raffle->draws_at->isPast()) {
                throw ValidationException::withMessages(['request' => 'The raffle is closed, so no ticket can be issued. Reject the request instead.']);
            }

            $ticket = $allocator->allocate($raffle, $entry->user, 1, Ticket::TYPE_FREE, ['free_entry_request_id' => $entry->id])->first();
            $entry->update(['status' => FreeEntryRequest::STATUS_APPROVED, 'processed_at' => now()]);

            return $ticket;
        });

        $freeEntry->refresh()->load('raffle');
        Mail::to($freeEntry->email)->send(new FreeEntryDecision($freeEntry, $ticket->number));

        return back()->with('success', "Approved. Free ticket #{$ticket->number} issued.");
    }

    public function reject(Request $request, FreeEntryRequest $freeEntry): RedirectResponse
    {
        $data = $request->validate(['admin_note' => ['required', 'string', 'max:500']], ['admin_note.required' => 'Add a reason — it’s sent to the player.']);

        if ($freeEntry->status !== FreeEntryRequest::STATUS_PENDING) {
            return back()->with('error', 'This request has already been processed.');
        }

        $freeEntry->update(['status' => FreeEntryRequest::STATUS_REJECTED, 'admin_note' => $data['admin_note'], 'processed_at' => now()]);
        $freeEntry->load('raffle');
        Mail::to($freeEntry->email)->send(new FreeEntryDecision($freeEntry, null));

        return back()->with('success', 'Request rejected and the player notified.');
    }
}
