import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const KEY = 'lt_session_start';
const now = () => Date.now();
const get = (k) => {
    try {
        return sessionStorage.getItem(k);
    } catch {
        return null;
    }
};
const set = (k, v) => {
    try {
        sessionStorage.setItem(k, v);
    } catch {}
};

/** Reality check: after the player's chosen interval, show how long they've been here. */
export default function SessionReminder() {
    const { auth } = usePage().props;
    const minutes = auth.user?.session_reminder_minutes;
    const [due, setDue] = useState(null);

    useEffect(() => {
        if (!minutes) return;
        if (!get(KEY)) set(KEY, String(now()));
        const tick = () => {
            const start = Number(get(KEY)) || now();
            const last = Number(get(`${KEY}_ack`)) || start;
            if (now() - last >= minutes * 60000) setDue(Math.round((now() - start) / 60000));
        };
        tick();
        const id = setInterval(tick, 30000);
        return () => clearInterval(id);
    }, [minutes]);

    if (!due) return null;

    const keepGoing = () => {
        set(`${KEY}_ack`, String(now()));
        setDue(null);
    };

    return (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4" role="alertdialog" aria-modal="true" aria-labelledby="rc-title">
            <div className="sheet-up w-full max-w-md rounded-2xl border border-line-2 bg-panel-2 p-6 text-center shadow-2xl">
                <span className="text-4xl" aria-hidden="true">⏱</span>
                <h2 id="rc-title" className="mt-3 font-wide text-2xl">Quick check-in</h2>
                <p className="mt-2 text-cream/80">You’ve been on GoLuckyTen for <strong className="text-white">{due} minutes</strong>. Fancy a break?</p>
                <div className="mt-6 grid gap-2">
                    <button onClick={keepGoing} className="btn btn-primary">Carry on</button>
                    <Link href="/account/safer-play" onClick={keepGoing} className="btn btn-ghost">See my spending and limits</Link>
                    <Link href="/logout" method="post" as="button" className="py-2 text-sm text-mist hover:text-white">Log out for now</Link>
                </div>
                <p className="mt-4 text-xs text-mist">Change how often you see this in Safer play.</p>
            </div>
        </div>
    );
}
