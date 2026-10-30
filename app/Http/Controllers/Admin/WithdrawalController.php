<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WithdrawalRequest;
use App\Notifications\SiteNotification;
use App\Services\WalletService;
use App\Support\Money;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class WithdrawalController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->query('status', 'pending');

        return Inertia::render('Admin/Withdrawals', [
            'status' => $status,
            'withdrawals' => WithdrawalRequest::with('user:id,name,surname,email')
                ->when($status !== 'all', fn ($q) => $q->where('status', $status))
                ->latest()->paginate(30)->withQueryString()
                ->through(fn ($w) => [
                    'id' => $w->id,
                    'amount_cents' => $w->amount_cents,
                    'account_name' => $w->account_name,
                    'iban' => $w->iban,
                    'status' => $w->status,
                    'admin_note' => $w->admin_note,
                    'created_at' => $w->created_at->toIso8601String(),
                    'user' => ['name' => $w->user->full_name, 'email' => $w->user->email],
                ]),
        ]);
    }

    public function paid(Request $request, WithdrawalRequest $withdrawal): RedirectResponse
    {
        abort_unless($withdrawal->status === 'pending', 422);
        $withdrawal->update(['status' => 'paid', 'processed_at' => now(), 'admin_note' => $request->input('note')]);
        $withdrawal->user->notify(new SiteNotification('Withdrawal sent', Money::format($withdrawal->amount_cents).' is on its way to your bank.', '/account/wallet', email: true, kind: 'wallet'));

        return back()->with('success', 'Marked as paid.');
    }

    public function reject(Request $request, WithdrawalRequest $withdrawal, WalletService $wallet): RedirectResponse
    {
        abort_unless($withdrawal->status === 'pending', 422);
        $data = $request->validate(['note' => ['required', 'string', 'max:500']]);

        DB::transaction(function () use ($withdrawal, $wallet, $data) {
            $withdrawal->update(['status' => 'rejected', 'processed_at' => now(), 'admin_note' => $data['note']]);
            $wallet->credit($withdrawal->user, $withdrawal->amount_cents, 'refund', 'Withdrawal returned: '.$data['note']);
        });
        $withdrawal->user->notify(new SiteNotification('Withdrawal returned to your wallet', $data['note'], '/account/wallet', email: true, kind: 'wallet'));

        return back()->with('success', 'Rejected and refunded to the wallet.');
    }
}
