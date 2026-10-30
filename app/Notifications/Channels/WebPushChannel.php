<?php

namespace App\Notifications\Channels;

use App\Models\PushSubscription;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

/**
 * Sends browser push notifications via minishlink/web-push.
 * Silently skips when the library or VAPID keys aren't configured.
 */
class WebPushChannel
{
    public static function enabled(): bool
    {
        return class_exists(\Minishlink\WebPush\WebPush::class)
            && config('company.vapid_public_key') && config('company.vapid_private_key');
    }

    public function send(object $notifiable, Notification $notification): void
    {
        if (! self::enabled() || ! method_exists($notification, 'toWebPush')) {
            return;
        }
        $subs = $notifiable->pushSubscriptions()->get();
        if ($subs->isEmpty()) {
            return;
        }

        $payload = json_encode($notification->toWebPush($notifiable));
        $push = new \Minishlink\WebPush\WebPush(['VAPID' => [
            'subject' => config('company.vapid_subject'),
            'publicKey' => config('company.vapid_public_key'),
            'privateKey' => config('company.vapid_private_key'),
        ]]);

        foreach ($subs as $sub) {
            $push->queueNotification(\Minishlink\WebPush\Subscription::create([
                'endpoint' => $sub->endpoint,
                'publicKey' => $sub->public_key,
                'authToken' => $sub->auth_token,
            ]), $payload);
        }

        foreach ($push->flush() as $report) {
            if ($report->isSubscriptionExpired()) {
                PushSubscription::where('endpoint_hash', hash('sha256', $report->getEndpoint()))->delete();
            } elseif (! $report->isSuccess()) {
                Log::warning('Web push failed: '.$report->getReason());
            }
        }
    }
}
