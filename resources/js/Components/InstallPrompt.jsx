import { useEffect, useState } from 'react';

/** Offers "Add to home screen" once, after a second visit, when the browser allows it. */
export default function InstallPrompt() {
    const [evt, setEvt] = useState(null);

    useEffect(() => {
        let visits = 0;
        try {
            visits = Number(localStorage.getItem('lt_visits') || 0) + 1;
            localStorage.setItem('lt_visits', String(visits));
            if (localStorage.getItem('lt_install_dismissed')) return;
        } catch {}
        const onPrompt = (e) => {
            e.preventDefault();
            if (visits >= 2) setEvt(e);
        };
        window.addEventListener('beforeinstallprompt', onPrompt);
        return () => window.removeEventListener('beforeinstallprompt', onPrompt);
    }, []);

    if (!evt) return null;
    const dismiss = () => {
        try {
            localStorage.setItem('lt_install_dismissed', '1');
        } catch {}
        setEvt(null);
    };

    return (
        <div className="no-print fixed bottom-4 left-4 z-50 max-w-xs">
            <div className="sheet-up flex items-center gap-3 rounded-2xl border border-line-2 bg-panel-2 p-3.5 shadow-2xl">
                <img src="/images/brand/icon-192.png" alt="" className="h-11 w-11 rounded-xl" />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">Get the GoLuckyTen app</p>
                    <p className="text-xs text-mist">One tap from your home screen.</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={async () => { evt.prompt(); await evt.userChoice; dismiss(); }}>Install</button>
                <button onClick={dismiss} className="p-1 text-mist hover:text-white" aria-label="Not now">✕</button>
            </div>
        </div>
    );
}
