<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\FreeEntryRequest;
use App\Models\InstantWinPrize;
use App\Models\WithdrawalRequest;
use App\Support\Money;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

/** GDPR: download everything we hold about you, or close the account. */
class PrivacyController extends Controller
{
    public function export(Request $request): Response
    {
        $u = $request->user();
        $data = [
            'exported_at' => now()->toIso8601String(),
            'controller' => config('company.name'),
            'profile' => $u->only(['name', 'surname', 'email', 'phone', 'address_line', 'city', 'country', 'post_code', 'profile_public', 'public_id', 'referral_code', 'created_at', 'terms_accepted_at'])
                + ['date_of_birth' => $u->date_of_birth?->toDateString()],
            'settings' => $u->only(['spend_limit_cents', 'spend_limit_period', 'excluded_until', 'session_reminder_minutes', 'favourite_categories', 'notify_draw_reminders', 'notify_new_competitions']),
            'wallet' => [
                'balance_cents' => $u->wallet_balance_cents,
                'transactions' => $u->walletTransactions()->orderBy('id')->get(['amount_cents', 'balance_after_cents', 'type', 'description', 'created_at']),
                'withdrawals' => WithdrawalRequest::where('user_id', $u->id)->get(['amount_cents', 'account_name', 'iban', 'status', 'created_at', 'processed_at']),
            ],
            'orders' => $u->orders()->with('items.raffle:id,title')->orderBy('id')->get()->map(fn ($o) => [
                'reference' => $o->reference, 'invoice_number' => $o->invoice_number, 'status' => $o->status,
                'total_cents' => $o->total_cents, 'discount_cents' => $o->discount_cents, 'wallet_cents' => $o->wallet_cents,
                'paid_at' => $o->paid_at,
                'items' => $o->items->map(fn ($i) => ['competition' => $i->raffle?->title, 'quantity' => $i->quantity, 'total_cents' => $i->total_cents]),
            ]),
            'tickets' => $u->tickets()->with('raffle:id,title')->orderBy('id')->get()->map(fn ($t) => [
                'competition' => $t->raffle?->title, 'number' => $t->number, 'entry_type' => $t->entry_type, 'created_at' => $t->created_at,
            ]),
            'free_entries' => FreeEntryRequest::where('user_id', $u->id)->get()->makeHidden(['user_id']),
            'instant_wins' => InstantWinPrize::where('user_id', $u->id)->get(['title', 'prize_type', 'value_cents', 'ticket_number', 'won_at']),
            'referrals' => $u->referrals()->get()->map(fn ($r) => ['name' => $r->public_name, 'joined_at' => $r->created_at]),
            'notifications' => $u->notifications()->get(['data', 'read_at', 'created_at']),
        ];

        return response()->streamDownload(
            fn () => print (json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)),
            'goluckyten-my-data-'.now()->format('Y-m-d').'.json',
            ['Content-Type' => 'application/json'],
        );
    }

    /**
     * We anonymise rather than hard-delete: tickets and invoices must stay for draw integrity
     * and tax records, but nothing left on them points to you.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate(['password' => ['required', 'current_password'], 'confirm' => ['required', 'in:DELETE']], [
            'confirm.in' => 'Type DELETE to confirm.',
        ]);
        $u = $request->user();

        if ($u->is_admin) {
            throw ValidationException::withMessages(['password' => 'Admin accounts can’t be deleted here.']);
        }
        if ($u->wallet_balance_cents > 0) {
            throw ValidationException::withMessages(['password' => 'You still have '.Money::format($u->wallet_balance_cents).' in your wallet. Withdraw it first.']);
        }
        if (WithdrawalRequest::where('user_id', $u->id)->where('status', 'pending')->exists()) {
            throw ValidationException::withMessages(['password' => 'Please wait until your pending withdrawal is paid.']);
        }

        DB::transaction(function () use ($u) {
            $u->pushSubscriptions()->delete();
            $u->notifications()->delete();
            $u->forceFill([
                'name' => 'Deleted',
                'surname' => 'player',
                'email' => "deleted-{$u->id}-".Str::lower(Str::random(6)).'@deleted.invalid',
                'phone' => '',
                'address_line' => '',
                'city' => '',
                'post_code' => '',
                'date_of_birth' => '1900-01-01',
                'password' => Str::random(40),
                'remember_token' => null,
                'profile_public' => false,
                'favourite_categories' => null,
                'notify_draw_reminders' => false,
                'notify_new_competitions' => false,
                'anonymised_at' => now(),
            ])->save();
            WithdrawalRequest::where('user_id', $u->id)->update(['account_name' => 'Deleted', 'iban' => 'XX00DELETED']);
            FreeEntryRequest::where('user_id', $u->id)->update(['full_name' => 'Deleted player', 'email' => 'deleted@deleted.invalid', 'address' => '', 'statement' => '']);
            DB::table('sessions')->where('user_id', $u->id)->delete();
        });

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home')->with('success', 'Your account has been closed and your personal data removed.');
    }
}
