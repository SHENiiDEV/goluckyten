<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use App\Notifications\SiteNotification;
use App\Support\Money;

/** Both players get wallet credit once the invited friend's first paid order clears the minimum. */
class ReferralService
{
    public function __construct(private WalletService $wallet) {}

    public function rewardIfDue(User $user, Order $order): void
    {
        $bonus = (int) config('company.referral_bonus_cents');
        if (! $user->referred_by_id || $user->referral_rewarded_at || $bonus <= 0) {
            return;
        }
        if ($order->subtotal_cents < (int) config('company.referral_min_spend_cents')) {
            return;
        }
        $referrer = User::find($user->referred_by_id);
        if (! $referrer || $referrer->anonymised_at) {
            return;
        }

        $user->forceFill(['referral_rewarded_at' => now()])->save();
        $this->wallet->credit($user, $bonus, 'referral', 'Welcome bonus for joining with a friend’s link');
        $this->wallet->credit($referrer, $bonus, 'referral', "Referral bonus: {$user->public_name} made their first entry");

        $referrer->notify(new SiteNotification(
            'Referral bonus',
            Money::format($bonus)." added to your balance. {$user->public_name} joined with your link.",
            '/account/wallet',
        ));
    }
}
