import { number, pct } from '../lib/format';

export default function Progress({ sold, max, showLabel = true, compact = false }) {
    const p = pct(sold, max);
    const exact = max ? Math.min(100, (sold / max) * 100) : 0;
    return (
        <div>
            {showLabel && compact && <div className="mb-1.5 text-sm font-bold"><span className="num">{sold > 0 && exact < 0.1 ? '<0.1' : exact < 10 ? exact.toFixed(1) : Math.round(exact)}%</span> sold</div>}
            <div className="h-2.5 overflow-hidden rounded-full bg-white/90" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100} aria-label="Tickets sold">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-deep to-violet" style={{ width: `${Math.max(exact, 1.5)}%` }} />
            </div>
            {showLabel && !compact && (
                <div className="mt-2 flex justify-between text-xs text-mist">
                    <span className="num">{number(sold)} of {number(max)} sold</span>
                    <span className="num font-semibold text-cream">{sold > 0 && exact < 0.1 ? '<0.1' : exact < 10 ? exact.toFixed(1) : p}%</span>
                </div>
            )}
        </div>
    );
}
