<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use App\Support\Money;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

/**
 * Spend limits and self-exclusion. Lowering a limit is immediate;
 * raising or removing it only takes effect after a 24-hour cooling-off period.
 */
class ResponsiblePlay
{
    public const PERIODS = ['day' => 'per day', 'week' => 'per week', 'month' => 'per month'];
    public const COOLING_HOURS = 24;

    public function applyPending(User $user): void
    {
        if ($user->pending_spend_limit_at && $user->pending_spend_limit_at->isPast()) {
            $user->forceFill([
                'spend_limit_cents' => $user->pending_spend_limit_remove ? null : $user->pending_spend_limit_cents,
                'spend_limit_period' => $user->pending_spend_limit_remove ? null : $user->pending_spend_limit_period,
                'pending_spend_limit_cents' => null,
                'pending_spend_limit_period' => null,
                'pending_spend_limit_at' => null,
                'pending_spend_limit_remove' => false,
            ])->save();
        }
    }

    /** @return string immediate|pending */
    public function setLimit(User $user, ?int $cents, ?string $period): string
    {
        $this->applyPending($user);
        $current = $this->dailyEquivalent($user->spend_limit_cents, $user->spend_limit_period);
        $next = $this->dailyEquivalent($cents, $period);

        $loosening = $cents === null ? $user->spend_limit_cents !== null : ($current !== null && $next > $current);

        if (! $loosening) {
            $user->forceFill([
                'spend_limit_cents' => $cents,
                'spend_limit_period' => $cents === null ? null : $period,
                'pending_spend_limit_cents' => null,
                'pending_spend_limit_period' => null,
                'pending_spend_limit_at' => null,
                'pending_spend_limit_remove' => false,
            ])->save();

            return 'immediate';
        }

        $user->forceFill([
            'pending_spend_limit_cents' => $cents,
            'pending_spend_limit_period' => $period,
            'pending_spend_limit_remove' => $cents === null,
            'pending_spend_limit_at' => now()->addHours(self::COOLING_HOURS),
        ])->save();

        return 'pending';
    }

    public function periodStart(string $period): Carbon
    {
        return match ($period) {
            'day' => now()->startOfDay(),
            'week' => now()->startOfWeek(),
            default => now()->startOfMonth(),
        };
    }

    public function spent(User $user, string $period): int
    {
        return (int) Order::where('user_id', $user->id)->where('status', 'paid')
            ->where('paid_at', '>=', $this->periodStart($period))->sum('total_cents');
    }

    public function remaining(User $user): ?int
    {
        $this->applyPending($user);
        if ($user->spend_limit_cents === null) {
            return null;
        }

        return max(0, $user->spend_limit_cents - $this->spent($user, $user->spend_limit_period));
    }

    public function assertCanSpend(User $user, int $cents): void
    {
        if ($user->isExcluded()) {
            throw ValidationException::withMessages(['basket' => 'Your account is self-excluded until '.$user->excluded_until->format('j F Y').'. You can’t enter competitions until then.']);
        }
        $remaining = $this->remaining($user);
        if ($remaining !== null && $cents > $remaining) {
            throw ValidationException::withMessages([
                'basket' => 'This would take you over your spend limit of '.Money::format($user->spend_limit_cents).' '.self::PERIODS[$user->spend_limit_period].'. You have '.Money::format($remaining).' left.',
            ]);
        }
    }

    public function exclude(User $user, string $length): void
    {
        $until = match ($length) {
            '24h' => now()->addDay(),
            '1w' => now()->addWeek(),
            '1m' => now()->addMonth(),
            '6m' => now()->addMonths(6),
            '1y' => now()->addYear(),
            '5y' => now()->addYears(5),
        };
        $user->forceFill(['excluded_until' => $until])->save();
    }

    private function dailyEquivalent(?int $cents, ?string $period): ?float
    {
        if ($cents === null) {
            return null;
        }

        return $cents / ['day' => 1, 'week' => 7, 'month' => 30][$period ?? 'month'];
    }
}
