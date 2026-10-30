import useCountdown from '../lib/useCountdown';

const pad = (n) => String(n).padStart(2, '0');

export function useEndsLabel(iso) {
    const t = useCountdown(iso);
    if (t.done) return { label: 'Drawing now', urgent: true, t };
    const end = new Date(iso);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    if (end.toDateString() === now.toDateString()) return { label: 'Ends tonight', urgent: true, t };
    if (end.toDateString() === tomorrow.toDateString()) return { label: 'Ends tomorrow', urgent: true, t };
    return { label: `Ends in ${t.days} days`, urgent: false, t };
}

/** The pill that sits on top of cards: a live clock for the last 48h, otherwise "Ends in N days". */
export function CountdownPill({ to, className = '' }) {
    const { label, t } = useEndsLabel(to);
    const live = t.totalHours < 48 && !t.done;
    return (
        <span className={`num inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-lg ${live ? 'bg-hot text-white' : 'bg-violet-deep text-white'} ${className}`}>
            {live ? (
                <>
                    {t.days > 0 && <span>{t.days}D</span>}
                    <span>{pad(t.hours)}H</span>
                    <span>{pad(t.minutes)}M</span>
                    <span>{pad(t.seconds)}S</span>
                </>
            ) : (
                label
            )}
        </span>
    );
}

export default function Countdown({ to, size = 'md' }) {
    const t = useCountdown(to);

    if (t.done) return <span className="text-mist">Draw time reached</span>;

    if (size === 'sm') {
        const text = t.days > 0 ? `${t.days}d ${t.hours}h left` : `${pad(t.hours)}:${pad(t.minutes)}:${pad(t.seconds)} left`;
        return <span className={`num ${t.totalHours < 24 ? 'text-hot' : ''}`}>{text}</span>;
    }

    const units = [
        ['days', t.days],
        ['hrs', t.hours],
        ['min', t.minutes],
        ['sec', t.seconds],
    ];

    return (
        <div className="grid grid-cols-4 gap-2" role="timer" aria-label={`${t.days} days ${t.hours} hours ${t.minutes} minutes left`}>
            {units.map(([label, v]) => (
                <div key={label} className="rounded-xl border border-line bg-ink-2 px-2 py-2.5 text-center">
                    <div className={`num font-display leading-none text-white ${size === 'lg' ? 'text-3xl' : 'text-2xl'}`}>{pad(v)}</div>
                    <div className="mt-1 text-[11px] text-mist">{label}</div>
                </div>
            ))}
        </div>
    );
}
