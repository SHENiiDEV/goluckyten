import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { json } from '../../lib/http';
import SiteLayout from '../../Layouts/SiteLayout';
import Gallery from '../../Components/Gallery';
import InstantWinList from '../../Components/InstantWinList';
import Countdown, { CountdownPill } from '../../Components/Countdown';
import Progress from '../../Components/Progress';
import RaffleCard from '../../Components/RaffleCard';
import StatusBadge from '../../Components/StatusBadge';
import PlayerName from '../../Components/PlayerName';
import timeAgo from '../../lib/timeAgo';
import { date, dateTime, money, number } from '../../lib/format';

// Quick picks by spend: €1, €2.50, €5, €10, €25 worth of tickets at this price.
const spends = [100, 250, 500, 1000, 2500];
const presetsFor = (priceCents) => [...new Set(spends.map((c) => Math.max(1, Math.round(c / priceCents))))];

/** Pick-your-numbers: type numbers or take suggestions; everything else stays a lucky dip. */
function NumberPicker({ raffle, picks, setPicks, qty, setQty, maxAllowed }) {
    const [value, setValue] = useState('');
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const add = async (list) => {
        const fresh = list.map((n) => parseInt(n, 10)).filter((n) => Number.isFinite(n) && !picks.includes(n));
        if (!fresh.length) return;
        if (picks.length + fresh.length > maxAllowed) return setError(`You can pick up to ${number(maxAllowed)} numbers.`);
        setBusy(true);
        setError(null);
        try {
            const r = await json(`/raffles/${raffle.slug}/numbers?check=${fresh.join(',')}`);
            const bad = new Set([...r.taken, ...r.out_of_range]);
            const ok = fresh.filter((n) => !bad.has(n));
            if (r.out_of_range.length) setError(`Numbers run from 1 to ${number(r.max)}.`);
            else if (r.taken.length) setError(`#${r.taken.map(number).join(', #')} ${r.taken.length === 1 ? 'is' : 'are'} already taken.`);
            const next = [...picks, ...ok];
            setPicks(next);
            if (next.length > qty) setQty(next.length);
            setValue('');
        } catch {
            setError('Couldn’t check that number. Try again.');
        }
        setBusy(false);
    };
    const suggest = async () => {
        setBusy(true);
        try {
            const n = Math.min(5, maxAllowed - picks.length);
            const r = await json(`/raffles/${raffle.slug}/numbers?suggest=${n}`);
            const next = [...picks, ...r.suggestions.filter((x) => !picks.includes(x))].slice(0, maxAllowed);
            setPicks(next);
            if (next.length > qty) setQty(next.length);
        } catch {}
        setBusy(false);
    };

    return (
        <div className="swap-in mt-3 rounded-xl border border-line bg-ink-2 p-3.5">
            <div className="flex gap-2">
                <input
                    className="field num h-11 flex-1"
                    inputMode="numeric"
                    placeholder={`1 – ${number(raffle.max_tickets)}`}
                    aria-label="Ticket number"
                    value={value}
                    onChange={(e) => setValue(e.target.value.replace(/[^0-9, ]/g, ''))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(value.split(/[ ,]+/)); } }}
                />
                <button type="button" disabled={busy || !value} onClick={() => add(value.split(/[ ,]+/))} className="btn btn-ghost btn-sm h-11">Add</button>
                <button type="button" disabled={busy || picks.length >= maxAllowed} onClick={suggest} className="btn btn-ghost btn-sm h-11" title="Pick 5 free numbers for me">🎲</button>
            </div>
            {error && <p className="mt-2 text-xs text-ruby" role="alert">{error}</p>}
            {picks.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {picks.map((n) => (
                        <button type="button" key={n} onClick={() => setPicks(picks.filter((x) => x !== n))} className="pop-in num rounded-md bg-violet/20 px-2 py-1 text-xs font-bold text-violet-hi hover:bg-hot/20 hover:text-hot" aria-label={`Remove ${n}`}>
                            #{number(n)} ×
                        </button>
                    ))}
                </div>
            ) : (
                <p className="mt-2 text-xs text-mist">Type your lucky numbers, separated by commas, or tap 🎲 for free ones.</p>
            )}
            {qty > picks.length && picks.length > 0 && <p className="mt-2 text-xs text-mist">The other {number(qty - picks.length)} will be a lucky dip.</p>}
        </div>
    );
}

function TicketPicker({ raffle, cur, owned }) {
    const maxAllowed = Math.max(0, Math.min(raffle.max_per_user - owned, raffle.tickets_remaining));
    const presets = presetsFor(raffle.ticket_price_cents);
    const start = Math.min(presets[1] ?? presets[0], maxAllowed) || 1;
    const sliderMax = Math.min(maxAllowed, presets[presets.length - 1] * 4);
    const { data, setData, post, processing, errors, transform } = useForm({ raffle_id: raffle.id, quantity: start, buy_now: false, numbers: [] });
    const qty = data.quantity;
    const [mode, setMode] = useState('lucky');
    const clamp = (n) => Math.max(mode === 'pick' ? Math.max(1, data.numbers.length) : 1, Math.min(maxAllowed || 1, Number.isFinite(n) ? n : 1));
    const submit = (buyNow) => {
        transform((d) => ({ ...d, buy_now: buyNow, numbers: mode === 'pick' ? d.numbers : [] }));
        post('/basket', { preserveScroll: true, onSuccess: () => setData('numbers', []) });
    };

    if (maxAllowed === 0) {
        return <p className="rounded-xl border border-line p-4 text-sm text-mist">You’ve reached the {raffle.max_per_user}-ticket limit for this competition.</p>;
    }

    const odds = Math.max(1, Math.round(raffle.max_tickets / (qty + owned)));

    return (
        <div>
            <div className="flex items-center justify-between">
                <span className="text-sm font-bold">How many tickets?</span>
                <span className="text-xs text-mist">Max {number(maxAllowed)} per person</span>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2">
                {presets.filter((p) => p <= maxAllowed).map((p) => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => setData('quantity', p)}
                        className={`pressable num rounded-xl border py-2 text-base font-extrabold leading-tight ${qty === p ? 'border-violet bg-violet text-white' : 'border-line-2 bg-ink-2 text-cream hover:border-violet-hi'}`}
                    >
                        {number(p)}
                        <span className="block text-[11px] font-semibold opacity-70">{money(p * raffle.ticket_price_cents, cur).replace('.00', '')}</span>
                    </button>
                ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
                <button type="button" onClick={() => setData('quantity', clamp(qty - 1))} className="pressable grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-line-2 text-xl hover:border-violet-hi" aria-label="One fewer">−</button>
                <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={maxAllowed}
                    value={qty}
                    onChange={(e) => setData('quantity', clamp(parseInt(e.target.value, 10)))}
                    className="field num h-12 text-center text-xl font-extrabold"
                    aria-label="Number of tickets"
                />
                <button type="button" onClick={() => setData('quantity', clamp(qty + 1))} className="pressable grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-line-2 text-xl hover:border-violet-hi" aria-label="One more">+</button>
            </div>
            <input
                type="range"
                min={1}
                max={sliderMax}
                value={Math.min(qty, sliderMax)}
                onChange={(e) => setData('quantity', clamp(parseInt(e.target.value, 10)))}
                className="mt-4 w-full accent-[#7b5cfa]"
                aria-label="Number of tickets slider"
            />
            <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl border border-line bg-ink-2 p-1 text-sm font-semibold" role="tablist" aria-label="How to choose numbers">
                {[['lucky', '🍀 Lucky dip'], ['pick', '✍️ Pick numbers']].map(([k, l]) => (
                    <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => setMode(k)}
                        className={`rounded-lg py-2 transition-colors duration-150 ${mode === k ? 'bg-violet text-white' : 'text-cream/75 hover:text-white'}`}>{l}</button>
                ))}
            </div>
            {mode === 'pick' && (
                <NumberPicker raffle={raffle} picks={data.numbers} setPicks={(v) => setData('numbers', v)} qty={qty} setQty={(n) => setData('quantity', n)} maxAllowed={maxAllowed} />
            )}
            {(errors.quantity || errors.numbers) && <p className="mt-3 text-sm text-ruby" role="alert">{errors.quantity || errors.numbers}</p>}

            <div className="mt-5 flex items-end justify-between rounded-xl bg-ink-2 px-4 py-3">
                <div>
                    <div className="text-xs text-mist">Total</div>
                    <div className="num text-3xl font-extrabold text-white">{money(qty * raffle.ticket_price_cents, cur)}</div>
                </div>
                <div className="text-right text-xs text-mist">
                    Odds no worse than
                    <div className="num text-sm font-bold text-cream">1 in {number(odds)}</div>
                </div>
            </div>
            <div className="mt-4 grid gap-2.5">
                <button onClick={() => submit(true)} disabled={processing} className="btn btn-primary h-13 text-base">Enter now</button>
                <button onClick={() => submit(false)} disabled={processing} className="btn btn-ghost">Add to basket</button>
            </div>
        </div>
    );
}

export default function Show({ raffle, myTickets, myTicketCount, freeEntry, related, instantWins, myInstantWins, activity }) {
    const { app, auth } = usePage().props;
    const cur = app.currency;
    const [showAll, setShowAll] = useState(false);
    const nums = showAll ? myTickets : myTickets.slice(0, 30);
    const [tab, setTab] = useState(instantWins?.total ? 'instant' : 'details');

    const tabs = [
        ['details', 'Prize details'],
        ...(instantWins?.total ? [['instant', `Instant wins (${instantWins.remaining} left)`]] : []),
        ['draw', 'Draw information'],
        ['free', 'Free entry'],
    ];

    return (
        <SiteLayout>
            <Head title={raffle.title} />
            <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
                <nav className="text-sm text-mist" aria-label="Breadcrumb">
                    <Link href="/raffles" className="hover:text-white">Competitions</Link>
                    <span className="mx-2">/</span>
                    <Link href={`/raffles?category=${raffle.category}`} className="hover:text-white">{raffle.category_label}</Link>
                </nav>
            </div>

            <section className="mx-auto grid max-w-7xl gap-8 px-4 pt-5 sm:px-6 lg:grid-cols-[1.25fr_0.75fr] lg:gap-10 lg:px-8">
                <div className="min-w-0">
                    <Gallery cover={raffle.image_url} images={raffle.gallery} video={raffle.video_url} category={raffle.category} title={raffle.title} />
                </div>

                <aside className="lg:row-span-2">
                    <div className="space-y-4 lg:sticky lg:top-24">
                        <div className="rounded-2xl border border-line bg-panel p-5 sm:p-6">
                            <div className="flex flex-wrap items-center gap-2">
                                {raffle.is_open ? <CountdownPill to={raffle.draws_at} /> : <StatusBadge status={raffle.status} />}
                                {raffle.instant_total > 0 && (
                                    <span className="rounded-full bg-amber px-3 py-1 text-xs font-bold text-ink">{raffle.instant_left} instant wins left</span>
                                )}
                                {raffle.free_entry_enabled && raffle.is_open && <span className="rounded-full border border-jade/50 px-3 py-1 text-xs font-semibold text-[#7fe5bf]">Free entry</span>}
                            </div>
                            {raffle.brand && <p className="mt-4 text-sm font-semibold text-violet-hi">{raffle.brand}</p>}
                            <h1 className={`font-display text-3xl leading-tight sm:text-4xl ${raffle.brand ? 'mt-1' : 'mt-4'}`}>{raffle.title}</h1>
                            {raffle.subtitle && <p className="mt-2 text-cream/75">{raffle.subtitle}</p>}

                            <div className="mt-5 flex items-center gap-3">
                                <span className="num rounded-full bg-white px-4 py-1.5 text-lg font-extrabold text-ink">{money(raffle.ticket_price_cents, cur)}</span>
                                {raffle.regular_price_cents ? (
                                    <span className="text-sm"><span className="num text-mist line-through">{money(raffle.regular_price_cents, cur)}</span> <span className="font-bold text-hot">Flash sale</span></span>
                                ) : (
                                    <span className="text-sm text-mist">per ticket</span>
                                )}
                                {raffle.cash_alternative_cents && <span className="ml-auto text-right text-xs text-mist">or {money(raffle.cash_alternative_cents, cur, { compact: true })}<br />cash alternative</span>}
                            </div>

                            {raffle.is_open ? (
                                <>
                                    <div className="mt-5"><Countdown to={raffle.draws_at} /></div>
                                    <p className="mt-2 text-center text-xs text-mist">
                                        Draw {dateTime(raffle.draws_at)} · <Link href={`/raffles/${raffle.slug}/live`} className="text-violet-hi hover:text-white">watch it live</Link>
                                    </p>
                                    {raffle.sale_ends_at && (
                                        <p className="mt-3 rounded-lg bg-hot/10 px-3 py-2 text-center text-xs font-semibold text-hot">Sale price ends {dateTime(raffle.sale_ends_at)}</p>
                                    )}
                                    <div className="mt-5"><Progress sold={raffle.tickets_sold} max={raffle.max_tickets} /></div>
                                    <div className="my-5 border-t border-line" />
                                    <TicketPicker raffle={raffle} cur={cur} owned={myTicketCount} />
                                </>
                            ) : raffle.winner ? (
                                <div className="mt-6 rounded-xl bg-ink-2 p-5 text-center">
                                    <p className="text-sm text-mist">Winner, drawn {date(raffle.drawn_at)}</p>
                                    <p className="mt-1 text-2xl font-extrabold"><PlayerName name={raffle.winner.name} id={raffle.winner.player_id} className="" /></p>
                                    <p className="text-sm text-mist">{raffle.winner.city}</p>
                                    <p className="num mt-4 text-5xl font-extrabold text-violet-hi">#{raffle.winner.number}</p>
                                    <p className="mt-1 text-xs text-mist">winning ticket out of {number(raffle.tickets_sold)}</p>
                                    <Link href={`/raffles/${raffle.slug}/live`} className="mt-4 inline-block text-sm font-semibold text-violet-hi hover:text-white">Replay the draw and verify it →</Link>
                                </div>
                            ) : (
                                <div className="mt-6 rounded-xl bg-ink-2 p-5">
                                    <p className="text-lg font-bold">Entries are closed</p>
                                    <p className="mt-1 text-sm text-mist">The draw takes place {dateTime(raffle.draws_at)}. The winner will be shown here.</p>
                                    <Link href={`/raffles/${raffle.slug}/live`} className="btn btn-primary btn-sm mt-4">Watch the live draw</Link>
                                </div>
                            )}
                        </div>

                        {myInstantWins.length > 0 && (
                            <div className="rounded-2xl border border-amber/60 bg-amber/10 p-5">
                                <p className="font-bold text-amber">You’ve won {myInstantWins.length === 1 ? 'an instant prize' : `${myInstantWins.length} instant prizes`}</p>
                                <ul className="mt-2 space-y-1 text-sm">
                                    {myInstantWins.map((w) => (
                                        <li key={w.ticket_number}>{w.title} <span className="num text-mist">(ticket #{w.ticket_number})</span></li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {auth.user && myTickets.length > 0 && (
                            <div className="rounded-2xl border border-line bg-panel p-5">
                                <p className="text-sm font-bold">Your tickets ({number(myTicketCount)})</p>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {nums.map((t) => (
                                        <span key={t.number} className={`num rounded-md px-2 py-1 text-xs font-semibold ${t.entry_type === 'free' ? 'bg-jade/15 text-[#7fe5bf]' : 'bg-violet/15 text-violet-hi'}`}>{t.number}</span>
                                    ))}
                                </div>
                                {myTickets.length > 30 && (
                                    <button onClick={() => setShowAll(!showAll)} className="mt-3 text-xs font-semibold text-violet-hi underline underline-offset-4">
                                        {showAll ? 'Show fewer' : myTicketCount > myTickets.length ? `Show ${number(myTickets.length)} of ${number(myTicketCount)}` : `Show all ${number(myTicketCount)}`}
                                    </button>
                                )}
                            </div>
                        )}

                        {activity.length > 0 && (
                            <div className="rounded-2xl border border-line bg-panel p-5">
                                <p className="flex items-center gap-2 text-sm font-bold">
                                    <span className="h-2 w-2 rounded-full bg-jade" aria-hidden="true" />
                                    Latest entries
                                </p>
                                <ul className="mt-3 space-y-2.5">
                                    {activity.slice(0, 6).map((a) => (
                                        <li key={a.id} className="flex items-baseline justify-between gap-3 text-sm">
                                            <span className="min-w-0 truncate">
                                                <PlayerName name={a.name} id={a.player_id} className="font-semibold" />
                                                <span className="text-mist"> bought </span>
                                                <span className="num font-semibold">{number(a.quantity)}</span>
                                                <span className="text-mist"> {a.quantity === 1 ? 'ticket' : 'tickets'}</span>
                                            </span>
                                            <span className="shrink-0 text-xs text-mist">{timeAgo(a.at)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <p className="px-1 text-xs leading-relaxed text-mist">
                            18+ only. By entering you agree to our <Link href="/terms" className="underline">Terms &amp; Conditions</Link>. Ticket numbers are assigned at random.
                        </p>
                    </div>
                </aside>

                <div className="min-w-0">
                    <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                        <div className="inline-flex gap-1 rounded-xl border border-line bg-ink-2 p-1" role="tablist">
                            {tabs.map(([k, l]) => (
                                <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`pressable whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold ${tab === k ? 'bg-violet text-white' : 'text-cream/80 hover:text-white'}`}>
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div key={tab} className="swap-in mt-6" role="tabpanel">
                        {tab === 'details' && (
                            <div>
                                <div className="space-y-4 leading-relaxed text-cream/85">
                                    {raffle.description.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
                                </div>
                                {raffle.highlights.length > 0 && (
                                    <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                                        {raffle.highlights.map((h) => (
                                            <li key={h} className="flex items-start gap-3 rounded-xl border border-line bg-panel px-4 py-3 text-sm">
                                                <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-jade" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 10.5l4 4 8-9" /></svg>
                                                {h}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                        {tab === 'instant' && <InstantWinList summary={instantWins} bare />}
                        {tab === 'draw' && (
                            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
                                {[
                                    ['Prize value', money(raffle.retail_value_cents, cur, { compact: true })],
                                    ['Cash alternative', raffle.cash_alternative_cents ? money(raffle.cash_alternative_cents, cur, { compact: true }) : 'None'],
                                    ['Maximum tickets', number(raffle.max_tickets)],
                                    ['Limit per person', number(raffle.max_per_user)],
                                    ['Draw date', dateTime(raffle.draws_at)],
                                    ['Draw method', 'Secure random number generator'],
                                ].map(([k, v]) => (
                                    <div key={k} className="bg-panel p-4">
                                        <dt className="text-xs text-mist">{k}</dt>
                                        <dd className="num mt-1 font-semibold">{v}</dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                        {tab === 'free' && (
                            <div className="rounded-2xl border border-jade/30 bg-jade/[0.06] p-6">
                                <p className="text-lg font-bold">Enter this competition for free</p>
                                <p className="mt-2 max-w-xl text-sm text-cream/80">No purchase necessary. One free entry per person per competition, with exactly the same chance of winning as a paid ticket.</p>
                                {freeEntry ? (
                                    <p className="mt-4 text-sm">Your request <span className="num">{freeEntry.reference}</span> is <StatusBadge status={freeEntry.status} /></p>
                                ) : raffle.is_open && raffle.free_entry_enabled ? (
                                    <Link href={`/free-entry?raffle=${raffle.id}`} className="btn btn-jade mt-5">Request a free entry</Link>
                                ) : (
                                    <p className="mt-4 text-sm text-mist">Free entries for this competition are closed.</p>
                                )}
                                <Link href="/terms#free-entry" className="mt-4 block text-sm text-violet-hi underline underline-offset-4">Free entry rules</Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {related.length > 0 && (
                <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
                    <h2 className="font-display mb-9 text-3xl">You might also like</h2>
                    <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
                        {related.map((r) => <RaffleCard key={r.id} raffle={r} />)}
                    </div>
                </section>
            )}
        </SiteLayout>
    );
}
