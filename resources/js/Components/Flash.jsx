import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

/** Toast: enters and leaves through the bottom edge; the timer pauses while hovered or the tab is hidden. */
export default function Flash() {
    const { flash } = usePage().props;
    const [msg, setMsg] = useState(null);
    const [state, setState] = useState('closed');
    const timer = useRef(null);
    const remaining = useRef(5000);
    const startedAt = useRef(0);

    const close = () => {
        clearTimeout(timer.current);
        setState('closed');
    };
    const start = () => {
        clearTimeout(timer.current);
        startedAt.current = Date.now();
        timer.current = setTimeout(close, remaining.current);
    };
    const pause = () => {
        clearTimeout(timer.current);
        remaining.current = Math.max(1000, remaining.current - (Date.now() - startedAt.current));
    };

    useEffect(() => {
        const next = flash?.success ? { type: 'success', text: flash.success } : flash?.error ? { type: 'error', text: flash.error } : null;
        if (!next) return;
        setMsg({ ...next, id: Date.now() });
        setState('open');
        remaining.current = 5000;
        start();
        return () => clearTimeout(timer.current);
    }, [flash?.success, flash?.error]);

    useEffect(() => {
        const onVis = () => (document.hidden ? pause() : state === 'open' && start());
        document.addEventListener('visibilitychange', onVis);
        return () => document.removeEventListener('visibilitychange', onVis);
    }, [state]);

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4" aria-live="polite" role="status">
            {msg && (
                <div
                    key={msg.id}
                    data-state={state}
                    onMouseEnter={pause}
                    onMouseLeave={() => state === 'open' && start()}
                    onTransitionEnd={() => state === 'closed' && setMsg(null)}
                    className={`toast pointer-events-auto flex max-w-lg items-start gap-3 rounded-2xl border bg-panel-2/95 px-5 py-3.5 text-sm text-cream shadow-2xl backdrop-blur ${
                        msg.type === 'success' ? 'border-violet/50' : 'border-ruby/50'
                    }`}
                >
                    <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-bold ${msg.type === 'success' ? 'bg-jade text-ink' : 'bg-ruby text-white'}`} aria-hidden="true">
                        {msg.type === 'success' ? '✓' : '!'}
                    </span>
                    <span>{msg.text}</span>
                    <button onClick={close} className="pressable -my-1 ml-2 rounded-md px-1.5 text-lg leading-none text-mist hover:text-white" aria-label="Dismiss">×</button>
                </div>
            )}
        </div>
    );
}
