import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AccountShell from './AccountShell';
import { Input, Select } from '../../Components/Form';
import { date, dateTime, money } from '../../lib/format';

const breaks = [['24h', '24 hours'], ['1w', '1 week'], ['1m', '1 month'], ['6m', '6 months'], ['1y', '1 year'], ['5y', '5 years']];

function Meter({ spent, limit, cur }) {
    const pct = Math.min(100, Math.round((spent / limit) * 100));
    const tone = pct >= 90 ? 'bg-hot' : pct >= 70 ? 'bg-amber' : 'bg-jade';
    return (
        <div>
            <div className="h-3 overflow-hidden rounded-full bg-line">
                <div className={`h-full rounded-full ${tone} transition-[width] duration-500 ease-out`} style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-sm text-mist"><span className="num font-bold text-white">{money(spent, cur)}</span> of {money(limit, cur)} used</p>
        </div>
    );
}

export default function Safety({ limit, pending, periods, excluded_until, reminder_minutes, spent }) {
    const { app } = usePage().props;
    const cur = app.currency;
    const lim = useForm({ amount: limit.cents ? (limit.cents / 100).toString() : '', period: limit.period ?? 'week' });
    const ex = useForm({ length: '1w', password: '' });
    const [confirmBreak, setConfirmBreak] = useState(false);

    return (
        <AccountShell title="Safer play" intro="Competitions should stay fun. Set a budget, get a reminder, or take a break. Tightening takes effect at once; loosening waits 24 hours.">
            <div className="grid gap-4 sm:grid-cols-3">
                {[['Today', spent.day], ['This week', spent.week], ['This month', spent.month]].map(([l, v]) => (
                    <div key={l} className="card p-5"><p className="text-sm text-mist">Spent {l.toLowerCase()}</p><p className="num mt-1 font-wide text-3xl">{money(v, cur)}</p></div>
                ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <form onSubmit={(e) => { e.preventDefault(); lim.post('/account/safer-play/limit', { preserveScroll: true }); }} className="card space-y-5 p-6 sm:p-8">
                    <div>
                        <h2 className="font-display text-2xl">Spend limit</h2>
                        <p className="mt-1 text-sm text-mist">Counts what you pay for tickets, including wallet money. Free entries don’t count.</p>
                    </div>
                    {limit.cents && <Meter spent={limit.spent_cents} limit={limit.cents} cur={cur} />}
                    {pending && (
                        <div className="rounded-xl border border-amber/30 bg-amber/10 p-4 text-sm text-amber">
                            {pending.remove ? 'Removing your limit' : `Changing to ${money(pending.cents, cur)} ${periods[pending.period]}`} on {dateTime(pending.at)}.{' '}
                            <button type="button" onClick={() => router.delete('/account/safer-play/limit/pending', { preserveScroll: true })} className="font-semibold underline">Cancel change</button>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <Input label={`Amount (${cur})`} type="number" min="1" step="1" inputMode="numeric" placeholder="e.g. 20" value={lim.data.amount} onChange={(e) => lim.setData('amount', e.target.value)} error={lim.errors.amount} />
                        <Select label="Per" value={lim.data.period} onChange={(e) => lim.setData('period', e.target.value)} error={lim.errors.period}>
                            {Object.entries(periods).map(([k, v]) => <option key={k} value={k}>{v.replace('per ', '')}</option>)}
                        </Select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button disabled={lim.processing || !lim.data.amount} className="btn btn-primary">{limit.cents ? 'Update limit' : 'Set limit'}</button>
                        {limit.cents && (
                            <button type="button" onClick={() => router.post('/account/safer-play/limit', { amount: null, period: null }, { preserveScroll: true })} className="btn btn-ghost">Remove limit</button>
                        )}
                    </div>
                </form>

                <div className="card space-y-5 p-6 sm:p-8">
                    <div>
                        <h2 className="font-display text-2xl">Reality check</h2>
                        <p className="mt-1 text-sm text-mist">A pop-up that tells you how long you’ve been on the site.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[[null, 'Off'], [15, '15 min'], [30, '30 min'], [60, '1 hour'], [120, '2 hours']].map(([m, l]) => (
                            <button key={l} onClick={() => router.post('/account/safer-play/reminder', { minutes: m }, { preserveScroll: true })}
                                className={`pressable rounded-full border px-4 py-2 text-sm font-semibold ${reminder_minutes === m ? 'border-violet bg-violet/20 text-white' : 'border-line-2 text-cream/80 hover:border-violet'}`}>
                                {l}
                            </button>
                        ))}
                    </div>
                    <div className="border-t border-line pt-5">
                        <h3 className="font-bold text-white">Need to talk?</h3>
                        <p className="mt-1 text-sm text-mist">Free, confidential support, 24/7: <a href="https://www.gamcare.org.uk" target="_blank" rel="noreferrer" className="text-violet-hi underline">GamCare</a> (0808 8020 133), <a href="https://www.begambleaware.org" target="_blank" rel="noreferrer" className="text-violet-hi underline">BeGambleAware</a>. More in our <Link href="/responsible-play" className="text-violet-hi underline">Responsible play</Link> guide.</p>
                    </div>
                </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-line bg-gradient-to-br from-panel to-ink-2 p-6 sm:p-8">
                <h2 className="font-display text-2xl">Take a break</h2>
                {excluded_until ? (
                    <p className="mt-2 text-cream/85">You’re on a break until <strong className="text-white">{date(excluded_until)}</strong>. You can’t enter competitions or add to your basket until then, and a break can’t be shortened. You can still see your tickets and withdraw your balance.</p>
                ) : (
                    <>
                        <p className="mt-2 max-w-2xl text-sm text-cream/80">Block yourself from entering any competition for a set time. Once started it can’t be cancelled or shortened. Your tickets for draws already entered stay valid, and you can still withdraw.</p>
                        <div className="mt-5 flex flex-wrap gap-2">
                            {breaks.map(([k, l]) => (
                                <button key={k} onClick={() => ex.setData('length', k)} className={`pressable rounded-full border px-4 py-2 text-sm font-semibold ${ex.data.length === k ? 'border-hot bg-hot/15 text-white' : 'border-line-2 text-cream/80 hover:border-hot'}`}>{l}</button>
                            ))}
                        </div>
                        {!confirmBreak ? (
                            <button onClick={() => setConfirmBreak(true)} className="btn btn-ghost mt-5">Start a break of {breaks.find((b) => b[0] === ex.data.length)[1]}</button>
                        ) : (
                            <form onSubmit={(e) => { e.preventDefault(); ex.post('/account/safer-play/exclude', { preserveScroll: true }); }} className="mt-5 flex max-w-lg flex-col gap-3 sm:flex-row sm:items-end">
                                <Input className="flex-1" label="Confirm with your password" type="password" autoComplete="current-password" value={ex.data.password} onChange={(e) => ex.setData('password', e.target.value)} error={ex.errors.password || ex.errors.length} />
                                <button disabled={ex.processing} className="btn bg-hot text-white">Start break</button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </AccountShell>
    );
}
