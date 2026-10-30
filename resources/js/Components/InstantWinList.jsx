import { usePage } from '@inertiajs/react';
import { Fragment, useState } from 'react';
import PlayerName from './PlayerName';
import { money, number } from '../lib/format';

function PrizeIcon({ g }) {
    const [failed, setFailed] = useState(false);
    if (g.image_url && !failed) {
        return <img src={g.image_url} alt="" onError={() => setFailed(true)} className="h-11 w-11 shrink-0 rounded-full border border-amber/60 object-cover" />;
    }
    return (
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border ${g.type === 'cash' ? 'border-amber/60 text-amber' : 'border-jade/50 text-[#8fd9c1]'}`} aria-hidden="true">
            {g.type === 'cash' ? '€' : '✦'}
        </span>
    );
}

export default function InstantWinList({ summary, bare = false }) {
    const { app } = usePage().props;
    if (!summary || summary.total === 0) return null;

    return (
        <section className={bare ? '' : 'mt-12'} aria-label="Instant wins">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    {!bare && <h2 className="font-display text-3xl">Instant wins</h2>}
                    <p className="mt-1 max-w-xl text-sm text-cream/80">
                        {number(summary.total)} prizes worth {money(summary.total_value_cents, app.currency, { compact: true })} are hidden behind ticket numbers. Hit one and it’s yours the moment you buy.
                    </p>
                </div>
                <span className="num rounded-full bg-amber px-3 py-1 text-sm font-bold text-ink">{number(summary.remaining)} still to win</span>
            </div>
            <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
                {summary.groups.map((g) => {
                    const gone = g.remaining === 0;
                    return (
                        <li key={g.title + g.value_cents} className={`grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center ${gone ? 'opacity-60' : ''}`}>
                            <div className="flex items-center gap-4">
                                <PrizeIcon g={g} />
                                <div>
                                    <p className="font-semibold">{g.title}</p>
                                    {g.winners.length > 0 && (
                                        <p className="mt-0.5 text-xs text-mist">
                                            Won by{' '}
                                            {g.winners.slice(0, 3).map((w, k) => (
                                                <Fragment key={w.number}>
                                                    {k > 0 && ', '}
                                                    <PlayerName name={w.name} id={w.player_id} className="text-cream/90" /> (#{w.number})
                                                </Fragment>
                                            ))}
                                            {g.winners.length > 3 ? ' and others' : ''}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 sm:justify-end">
                                <div className="h-1.5 w-28 overflow-hidden rounded-full bg-line">
                                    <div className="h-full bg-amber" style={{ width: `${(g.remaining / g.total) * 100}%` }} />
                                </div>
                                <span className="num w-24 text-right text-sm">{gone ? 'All won' : `${g.remaining} of ${g.total} left`}</span>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
