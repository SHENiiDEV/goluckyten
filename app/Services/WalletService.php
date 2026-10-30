<?php

namespace App\Services;

use App\Models\User;
use App\Models\WalletTransaction;
use App\Support\Money;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** Player balance with an append-only ledger. The ledger is the source of truth. */
class WalletService
{
    /** @param  array{order_id?: int|null, instant_win_prize_id?: int|null}  $links */
    public function credit(User $user, int $cents, string $type, string $description, array $links = []): WalletTransaction
    {
        return $this->move($user, abs($cents), $type, $description, $links);
    }

    /** @param  array{order_id?: int|null, instant_win_prize_id?: int|null}  $links */
    public function debit(User $user, int $cents, string $type, string $description, array $links = []): WalletTransaction
    {
        return $this->move($user, -abs($cents), $type, $description, $links);
    }

    private function move(User $user, int $cents, string $type, string $description, array $links): WalletTransaction
    {
        return DB::transaction(function () use ($user, $cents, $type, $description, $links) {
            $fresh = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $balance = $fresh->wallet_balance_cents + $cents;
            if ($balance < 0) {
                throw ValidationException::withMessages(['wallet' => 'Your balance is '.Money::format($fresh->wallet_balance_cents).', which isn’t enough.']);
            }
            $fresh->forceFill(['wallet_balance_cents' => $balance])->save();
            $user->wallet_balance_cents = $balance;

            return WalletTransaction::create([
                'user_id' => $user->id,
                'amount_cents' => $cents,
                'balance_after_cents' => $balance,
                'type' => $type,
                'description' => $description,
                'order_id' => $links['order_id'] ?? null,
                'instant_win_prize_id' => $links['instant_win_prize_id'] ?? null,
            ]);
        });
    }
}
