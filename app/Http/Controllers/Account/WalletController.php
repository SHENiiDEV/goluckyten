<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\WithdrawalRequest;
use App\Services\WalletService;
use App\Support\Money;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class WalletController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Account/Wallet', [
            'balance_cents' => $user->wallet_balance_cents,
            'min_withdrawal_cents' => (int) config('company.withdrawal_min_cents'),
            'transactions' => $user->walletTransactions()->latest('id')->paginate(20)->through(fn ($t) => [
                'id' => $t->id,
                'amount_cents' => $t->amount_cents,
                'balance_after_cents' => $t->balance_after_cents,
                'type' => $t->type,
                'description' => $t->description,
                'created_at' => $t->created_at->toIso8601String(),
            ]),
            'withdrawals' => WithdrawalRequest::where('user_id', $user->id)->latest()->take(10)->get()->map(fn ($w) => [
                'id' => $w->id,
                'amount_cents' => $w->amount_cents,
                'iban' => '•••• '.substr($w->iban, -4),
                'status' => $w->status,
                'admin_note' => $w->admin_note,
                'created_at' => $w->created_at->toIso8601String(),
            ]),
            'defaultName' => $user->full_name,
        ]);
    }

    public function withdraw(Request $request, WalletService $wallet): RedirectResponse
    {
        $min = (int) config('company.withdrawal_min_cents');
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:'.($min / 100)],
            'account_name' => ['required', 'string', 'max:120'],
            'iban' => ['required', 'string', 'regex:/^[A-Z]{2}[0-9]{2}[A-Z0-9 ]{10,32}$/i'],
        ], ['iban.regex' => 'That doesn’t look like an IBAN.', 'amount.min' => 'The minimum withdrawal is '.Money::format($min).'.']);

        $cents = (int) round($data['amount'] * 100);
        $user = $request->user();

        DB::transaction(function () use ($wallet, $user, $cents, $data) {
            $w = WithdrawalRequest::create([
                'user_id' => $user->id,
                'amount_cents' => $cents,
                'account_name' => $data['account_name'],
                'iban' => strtoupper(str_replace(' ', '', $data['iban'])),
            ]);
            $wallet->debit($user, $cents, 'withdrawal', 'Withdrawal to bank •••• '.substr($w->iban, -4));
        });

        return back()->with('success', 'Withdrawal requested. We pay out within 3 working days.');
    }
}
