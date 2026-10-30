import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const NAME = 'lt_consent';
const read = () => {
    const m = document.cookie.match(new RegExp(`(?:^|; )${NAME}=([^;]+)`));
    try {
        return m ? JSON.parse(decodeURIComponent(m[1])) : null;
    } catch {
        return null;
    }
};
const write = (v) => {
    document.cookie = `${NAME}=${encodeURIComponent(JSON.stringify({ ...v, at: new Date().toISOString() }))}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent('lt:consent', { detail: v }));
};

/** Ask before anything non-essential. We only set essential cookies today; the switches are ready for analytics/marketing tags. */
export function hasConsent(kind) {
    return !!read()?.[kind];
}
export function openCookieSettings() {
    window.dispatchEvent(new Event('lt:cookie-settings'));
}

function Toggle({ checked, onChange, disabled, label, children }) {
    return (
        <label className={`flex items-start justify-between gap-4 rounded-xl border border-line p-3.5 ${disabled ? 'opacity-80' : 'cursor-pointer hover:border-line-2'}`}>
            <span>
                <span className="block text-sm font-semibold text-white">{label}</span>
                <span className="mt-0.5 block text-xs text-mist">{children}</span>
            </span>
            <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} />
            <span aria-hidden="true" className="relative mt-0.5 h-6 w-10 shrink-0 rounded-full bg-line-2 transition-colors duration-200 peer-checked:bg-violet peer-focus-visible:ring-2 peer-focus-visible:ring-violet-hi after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform after:duration-200 after:ease-out peer-checked:after:translate-x-4" />
        </label>
    );
}

export default function CookieBanner() {
    const [show, setShow] = useState(false);
    const [detail, setDetail] = useState(false);
    const [prefs, setPrefs] = useState({ analytics: false, marketing: false });

    useEffect(() => {
        const saved = read();
        if (!saved) setShow(true);
        else setPrefs({ analytics: !!saved.analytics, marketing: !!saved.marketing });
        const reopen = () => {
            setDetail(true);
            setShow(true);
        };
        window.addEventListener('lt:cookie-settings', reopen);
        return () => window.removeEventListener('lt:cookie-settings', reopen);
    }, []);

    const save = (v) => {
        write({ essential: true, ...v });
        setShow(false);
        setDetail(false);
    };

    if (!show) return null;

    return (
        <div className="no-print fixed inset-x-0 bottom-0 z-[55] p-3 sm:p-5" role="dialog" aria-label="Cookie preferences" aria-live="polite">
            <div className="sheet-up mx-auto max-w-3xl rounded-2xl border border-line-2 bg-panel-2/95 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <span className="text-3xl" aria-hidden="true">🍪</span>
                    <div className="flex-1">
                        <h2 className="font-wide text-lg">Cookies, briefly</h2>
                        <p className="mt-1 text-sm leading-relaxed text-cream/80">
                            We use essential cookies to keep you signed in, hold your basket and protect forms. With your OK we’d also like to measure visits and show relevant offers.
                            Read the <Link href="/cookies" className="text-violet-hi underline underline-offset-2">Cookie Policy</Link>.
                        </p>
                    </div>
                </div>
                {detail && (
                    <div className="mt-4 grid gap-2.5">
                        <Toggle checked disabled label="Essential">Sign-in, basket, security. Always on, the site can’t work without them.</Toggle>
                        <Toggle checked={prefs.analytics} onChange={(v) => setPrefs({ ...prefs, analytics: v })} label="Analytics">Anonymous counts of which pages are used, so we can improve them.</Toggle>
                        <Toggle checked={prefs.marketing} onChange={(v) => setPrefs({ ...prefs, marketing: v })} label="Marketing">Lets us measure ads and show you relevant competitions elsewhere.</Toggle>
                    </div>
                )}
                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    {detail ? (
                        <button className="btn btn-ghost btn-sm" onClick={() => save(prefs)}>Save choices</button>
                    ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => setDetail(true)}>Choose</button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => save({ analytics: false, marketing: false })}>Essential only</button>
                    <button className="btn btn-primary btn-sm" onClick={() => save({ analytics: true, marketing: true })}>Accept all</button>
                </div>
            </div>
        </div>
    );
}
