<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use App\Models\Raffle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $u = $request->user();

        return Inertia::render('Account/Notifications', [
            'notifications' => $u->notifications()->latest()->paginate(20)->through(fn ($n) => [
                'id' => $n->id,
                ...$n->data,
                'read' => (bool) $n->read_at,
                'created_at' => $n->created_at->toIso8601String(),
            ]),
            'settings' => [
                'favourite_categories' => $u->favourite_categories ?? [],
                'notify_draw_reminders' => $u->notify_draw_reminders,
                'notify_new_competitions' => $u->notify_new_competitions,
            ],
            'push' => [
                'configured' => (bool) config('company.vapid_public_key'),
                'subscriptions' => $u->pushSubscriptions()->count(),
            ],
        ]);
    }

    /** Latest few for the bell dropdown. */
    public function recent(Request $request): JsonResponse
    {
        $u = $request->user();

        return response()->json([
            'unread' => $u->unreadNotifications()->count(),
            'items' => $u->notifications()->latest()->take(8)->get()->map(fn ($n) => [
                'id' => $n->id, ...$n->data, 'read' => (bool) $n->read_at, 'created_at' => $n->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function read(Request $request, string $id): RedirectResponse|JsonResponse
    {
        $n = $request->user()->notifications()->findOrFail($id);
        $n->markAsRead();

        return $request->wantsJson() ? response()->json(['ok' => true]) : back();
    }

    public function readAll(Request $request): RedirectResponse|JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return $request->wantsJson() ? response()->json(['ok' => true]) : back();
    }

    public function settings(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'favourite_categories' => ['array'],
            'favourite_categories.*' => [Rule::in(array_keys(Raffle::CATEGORIES))],
            'notify_draw_reminders' => ['boolean'],
            'notify_new_competitions' => ['boolean'],
        ]);
        $request->user()->forceFill([
            'favourite_categories' => array_values($data['favourite_categories'] ?? []),
            'notify_draw_reminders' => $request->boolean('notify_draw_reminders'),
            'notify_new_competitions' => $request->boolean('notify_new_competitions'),
        ])->save();

        return back()->with('success', 'Notification settings saved.');
    }

    public function subscribe(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint' => ['required', 'url', 'max:2000'],
            'keys.p256dh' => ['required', 'string', 'max:255'],
            'keys.auth' => ['required', 'string', 'max:255'],
        ]);
        PushSubscription::updateOrCreate(
            ['endpoint_hash' => hash('sha256', $data['endpoint'])],
            ['user_id' => $request->user()->id, 'endpoint' => $data['endpoint'], 'public_key' => $data['keys']['p256dh'], 'auth_token' => $data['keys']['auth']],
        );

        return response()->json(['ok' => true]);
    }

    public function unsubscribe(Request $request): JsonResponse
    {
        $request->validate(['endpoint' => ['required', 'string']]);
        PushSubscription::where('user_id', $request->user()->id)->where('endpoint_hash', hash('sha256', $request->input('endpoint')))->delete();

        return response()->json(['ok' => true]);
    }
}
