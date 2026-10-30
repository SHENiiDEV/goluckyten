import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { json } from '../lib/http';
import timeAgo from '../lib/timeAgo';

const icons = { win: '🏆', reminder: '⏰', new: '✨', wallet: '💳', referral: '🤝', info: '🔔' };

export default function NotificationBell() {
    const { auth } = usePage().props;
    const [open, setOpen] = useState(false);
    const [data, setData] = useState(null);
    const ref = useRef(null);
    const unread = data?.unread ?? auth.user.unread_notifications ?? 0;

    useEffect(() => {
        const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
        const esc = (e) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('click', close);
        document.addEventListener('keydown', esc);
        const off = router.on('navigate', () => setOpen(false));
        return () => {
            document.removeEventListener('click', close);
            document.removeEventListener('keydown', esc);
            off();
        };
    }, []);

    const toggle = async () => {
        const next = !open;
        setOpen(next);
        if (next) setData(await json('/account/notifications/recent').catch(() => data));
    };
    const readAll = async () => {
        await json('/account/notifications/read', { method: 'POST' }).catch(() => {});
        setData((d) => d && { unread: 0, items: d.items.map((i) => ({ ...i, read: true })) });
    };
    const go = (n) => {
        if (!n.read) json(`/account/notifications/${n.id}/read`, { method: 'POST' }).catch(() => {});
        setOpen(false);
        if (n.url) router.visit(n.url);
    };

    return (
        <div className="relative" ref={ref}>
            <button onClick={toggle} className="pressable relative rounded-lg p-2.5 text-cream hover:text-violet-hi" aria-expanded={open} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 6 2 7H4c.5-1 2-3 2-7z" /><path d="M10 19a2 2 0 0 0 4 0" />
                </svg>
                {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-hot ring-2 ring-ink" />}
            </button>
            {open && (
                <div className="absolute right-0 top-full z-50 pt-2">
                    <div className="pop-in w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-line bg-panel-2 shadow-2xl" style={{ '--origin': 'calc(100% - 1.5rem) 0' }}>
                        <div className="flex items-center justify-between border-b border-line px-4 py-3">
                            <span className="font-bold">Notifications</span>
                            {unread > 0 && <button onClick={readAll} className="text-xs text-violet-hi hover:text-white">Mark all read</button>}
                        </div>
                        <ul className="max-h-96 overflow-y-auto">
                            {!data && <li className="px-4 py-6 text-center text-sm text-mist">Loading…</li>}
                            {data?.items.length === 0 && <li className="px-4 py-8 text-center text-sm text-mist">No notifications yet. We’ll tell you about draws, wins and new competitions here.</li>}
                            {data?.items.map((n) => (
                                <li key={n.id}>
                                    <button onClick={() => go(n)} className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-violet/10 ${n.read ? '' : 'bg-violet/[0.06]'}`}>
                                        <span className="text-lg" aria-hidden="true">{icons[n.kind] ?? icons.info}</span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-semibold text-white">{n.title}</span>
                                            <span className="line-clamp-2 block text-xs text-mist">{n.body}</span>
                                            <span className="mt-1 block text-[11px] text-mist/80">{timeAgo(n.created_at)}</span>
                                        </span>
                                        {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet" />}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <Link href="/account/notifications" className="block border-t border-line px-4 py-3 text-center text-sm text-cream/85 hover:text-white">All notifications and settings</Link>
                    </div>
                </div>
            )}
        </div>
    );
}
