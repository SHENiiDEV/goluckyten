import { router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AccountShell from './AccountShell';
import Pagination from '../../Components/Pagination';
import { Checkbox } from '../../Components/Form';
import timeAgo from '../../lib/timeAgo';
import { currentSubscription, disablePush, enablePush, pushSupported } from '../../lib/push';

const icons = { win: '🏆', reminder: '⏰', new: '✨', wallet: '💳', referral: '🤝', info: '🔔' };

function PushToggle({ configured }) {
    const { push } = usePage().props;
    const [state, setState] = useState('checking');
    useEffect(() => {
        if (!configured || !pushSupported()) return setState('unavailable');
        if (Notification.permission === 'denied') return setState('blocked');
        currentSubscription().then((s) => setState(s ? 'on' : 'off')).catch(() => setState('off'));
    }, []);

    const toggle = async () => {
        setState('working');
        try {
            if (state === 'on') {
                await disablePush();
                setState('off');
            } else {
                await enablePush(push.key);
                setState('on');
            }
        } catch {
            setState(Notification.permission === 'denied' ? 'blocked' : 'off');
        }
    };

    const text = {
        checking: 'Checking…',
        unavailable: 'This browser or device can’t receive push notifications from us yet.',
        blocked: 'Notifications are blocked for this site in your browser settings.',
        on: 'On for this device.',
        off: 'Get a buzz when you win or a draw starts, even with the site closed.',
        working: 'One moment…',
    }[state];

    return (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-line p-4">
            <div>
                <p className="font-semibold text-white">Browser notifications</p>
                <p className="mt-0.5 text-sm text-mist">{text}</p>
            </div>
            {['on', 'off', 'working'].includes(state) && (
                <button onClick={toggle} disabled={state === 'working'} className={`btn btn-sm ${state === 'on' ? 'btn-ghost' : 'btn-primary'}`}>{state === 'on' ? 'Turn off' : 'Turn on'}</button>
            )}
        </div>
    );
}

export default function Notifications({ notifications, settings, push }) {
    const { categories } = usePage().props;
    const form = useForm({ ...settings });
    const toggleCat = (k) => form.setData('favourite_categories', form.data.favourite_categories.includes(k) ? form.data.favourite_categories.filter((c) => c !== k) : [...form.data.favourite_categories, k]);
    const unread = notifications.data.some((n) => !n.read);

    return (
        <AccountShell title="Notifications">
            <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
                <div>
                    <div className="flex items-center justify-between">
                        <h2 className="font-display text-2xl">Inbox</h2>
                        {unread && <button onClick={() => router.post('/account/notifications/read', {}, { preserveScroll: true })} className="text-sm text-violet-hi hover:text-white">Mark all read</button>}
                    </div>
                    {notifications.data.length === 0 ? (
                        <p className="mt-4 rounded-2xl border border-dashed border-line-2 p-10 text-center text-mist">Nothing yet. Draw reminders, wins and new competitions will show up here.</p>
                    ) : (
                        <ul className="stagger mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line">
                            {notifications.data.map((n) => (
                                <li key={n.id}>
                                    <button
                                        onClick={() => { router.post(`/account/notifications/${n.id}/read`, {}, { preserveScroll: true, onSuccess: () => n.url && router.visit(n.url) }); }}
                                        className={`flex w-full gap-4 px-5 py-4 text-left hover:bg-violet/10 ${n.read ? '' : 'bg-violet/[0.06]'}`}
                                    >
                                        <span className="text-2xl" aria-hidden="true">{icons[n.kind] ?? icons.info}</span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block font-semibold text-white">{n.title}</span>
                                            <span className="block text-sm text-mist">{n.body}</span>
                                        </span>
                                        <span className="shrink-0 text-xs text-mist">{timeAgo(n.created_at)}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    <Pagination links={notifications.links} />
                </div>

                <form onSubmit={(e) => { e.preventDefault(); form.put('/account/notifications/settings', { preserveScroll: true }); }} className="card h-fit space-y-5 p-6">
                    <h2 className="font-display text-2xl">What to tell me</h2>
                    <Checkbox checked={form.data.notify_draw_reminders} onChange={(e) => form.setData('notify_draw_reminders', e.target.checked)}>
                        Remind me 24 hours before a draw I have tickets for (email and here)
                    </Checkbox>
                    <Checkbox checked={form.data.notify_new_competitions} onChange={(e) => form.setData('notify_new_competitions', e.target.checked)}>
                        Tell me when a new competition opens in my favourite categories
                    </Checkbox>
                    <div>
                        <p className="text-sm font-semibold text-cream/90">Favourite categories</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {categories.map((c) => {
                                const on = form.data.favourite_categories.includes(c.key);
                                return (
                                    <button type="button" key={c.key} onClick={() => toggleCat(c.key)} aria-pressed={on}
                                        className={`pressable rounded-full border px-3.5 py-1.5 text-sm ${on ? 'border-violet bg-violet/20 font-semibold text-white' : 'border-line-2 text-cream/75 hover:border-violet'}`}>
                                        {on ? '✓ ' : ''}{c.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <button disabled={form.processing} className="btn btn-primary">Save settings</button>
                    <PushToggle configured={push.configured} />
                    <p className="text-xs text-mist">Win notifications are always sent. Marketing emails are managed separately via the newsletter link in each email.</p>
                </form>
            </div>
        </AccountShell>
    );
}
