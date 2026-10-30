import { Head, Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import SiteLayout from '../Layouts/SiteLayout';
import Media from '../Components/Media';
import PlayerName from '../Components/PlayerName';
import useCountdown from '../lib/useCountdown';
import timeAgo from '../lib/timeAgo';
import { date, money, number } from '../lib/format';

const pad = (n) => String(n).padStart(2, '0');

/* ---------- shared bits ---------- */

function SectionTitle({ eyebrow, title, intro, align = 'center' }) {
    return (
        <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl'}>
            {eyebrow && <p className="text-sm font-semibold text-[#ff7a8a]">{eyebrow}</p>}
            <h2 className="font-wide mt-2 text-3xl uppercase leading-[1.02] sm:text-5xl">{title}</h2>
            {intro && <p className="mt-4 text-cream/70">{intro}</p>}
        </div>
    );
}

function CtaButton({ href, children, className = '' }) {
    return (
        <Link
            href={href}
            className={`btn bg-gradient-to-r from-[#ff6a5c] to-[#ff3d9a] px-7 text-white shadow-[0_12px_30px_-10px_rgba(255,77,140,0.8)] hover:from-[#ff7d70] hover:to-[#ff55a8] ${className}`}
        >
            {children}
        </Link>
    );
}

function MiniCountdown({ to }) {
    const t = useCountdown(to);
    const cells = [
        [t.days, 'Days'],
        [t.hours, 'Hrs'],
        [t.minutes, 'Min'],
        [t.seconds, 'Sec'],
    ];
    return (
        <div className="grid grid-cols-4 gap-1.5" role="timer" aria-label={`${t.days} days ${t.hours} hours left`}>
            {cells.map(([v, l]) => (
                <div key={l} className="rounded-lg bg-black/25 px-1 py-1.5 text-center">
                    <div className="num text-base font-extrabold leading-none text-white">{pad(v)}</div>
                    <div className="mt-0.5 text-[10px] text-white/60">{l}</div>
                </div>
            ))}
        </div>
    );
}

/* ---------- sections ---------- */

function EndingSoon({ list, cur }) {
    if (!list.length) return null;
    return (
        <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-3 rounded-3xl bg-panel/90 p-3 ring-1 ring-white/10 backdrop-blur md:grid-cols-3">
                {list.map((r) => (
                    <Link key={r.id} href={`/raffles/${r.slug}`} className="pressable grid grid-cols-[72px_1fr] items-center gap-3 rounded-2xl bg-ink-2 p-2.5 hover:bg-panel-2">
                        <span className="aspect-square overflow-hidden rounded-xl"><Media src={r.image_url} category={r.category} title="" /></span>
                        <span className="min-w-0">
                            <span className="flex items-center gap-2 text-xs font-bold text-[#ff7a8a]"><span className="h-1.5 w-1.5 rounded-full bg-[#ff7a8a]" aria-hidden="true" />Closing soon</span>
                            <span className="mt-0.5 block truncate text-sm font-bold">{r.title}</span>
                            <span className="num block text-xs text-mist"><SmallClock to={r.draws_at} />, {money(r.ticket_price_cents, cur)} a ticket</span>
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
}

function SmallClock({ to }) {
    const t = useCountdown(to);
    return <>{t.days > 0 ? `${t.days}d ${pad(t.hours)}h ${pad(t.minutes)}m` : `${pad(t.hours)}:${pad(t.minutes)}:${pad(t.seconds)}`} left</>;
}

function Categories({ items, cur }) {
    if (!items.length) return null;
    return (
        <section className="mx-auto max-w-7xl px-4 pb-4 pt-20 sm:px-6 lg:px-8">
            <SectionTitle eyebrow="Something for everyone" title="Pick your prize" align="left" />
            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                {items.map((c) => (
                    <Link key={c.key} href={`/raffles?category=${c.key}`} className="group relative aspect-[3/4] overflow-hidden rounded-3xl ring-1 ring-white/10">
                        <Media src={c.image_url} category={c.key} title={c.label} className="transition-transform duration-300 ease-out group-hover:scale-[1.04]" />
                        <span className="absolute inset-0 bg-gradient-to-t from-[#1b0d3d] via-[#1b0d3d]/40 to-transparent" />
                        <span className="absolute inset-x-0 bottom-0 p-4">
                            <span className="font-wide block text-lg uppercase leading-none">{c.label}</span>
                            <span className="mt-1 block text-xs text-white/75">{c.count} live, up to {money(c.top_value_cents, cur, { compact: true })}</span>
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
}

function InstantPool({ pool, cur }) {
    if (!pool.length) return null;
    return (
        <section className="relative overflow-hidden py-20">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(246,196,83,0.08),transparent_40%),radial-gradient(600px_300px_at_90%_50%,rgba(123,92,250,0.25),transparent_70%)]" aria-hidden="true" />
            <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
                <div className="lg:pt-6">
                    <SectionTitle eyebrow="Win the moment you buy" title="Instant wins up for grabs" align="left" intro="These prizes are hidden behind ticket numbers right now. If one of yours matches, it’s yours on the spot, and your ticket still goes into the main draw." />
                    <Link href="/raffles?tab=instant" className="btn mt-7 bg-amber px-7 font-extrabold text-ink hover:bg-[#ffd36e]">See instant win competitions</Link>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2">
                    {pool.map((p, k) => (
                        <li key={k}>
                            <Link href={`/raffles/${p.slug}`} className="pressable flex items-center gap-4 rounded-2xl bg-panel p-4 ring-1 ring-white/10 hover:ring-amber/50">
                                <span className={`num grid h-14 min-w-20 place-items-center rounded-xl px-2 text-base font-extrabold ${p.type === 'cash' ? 'bg-amber text-ink' : 'bg-violet text-white'}`}>
                                    {p.type === 'cash' ? money(p.value_cents, cur, { compact: true }).replace('.00', '') : '✦'}
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate font-bold">{p.title}</span>
                                    <span className="block truncate text-xs text-mist">{p.raffle}</span>
                                    <span className="num mt-1 inline-block rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-amber">{p.left} left to win</span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

const drawSteps = [
    ['Tickets on sale', 'Each competition opens with a fixed number of tickets and a set draw date. That number never goes up.'],
    ['Entries close', 'At the draw time, or as soon as every ticket is gone, whichever comes first.'],
    ['Random draw', 'One ticket is picked by a secure random number generator from every ticket issued, paid and free alike.'],
    ['Winner announced', 'We call the winner, publish the result with the ticket number and deliver the prize free, or pay the cash alternative.'],
];

function DrawTimeline() {
    return (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionTitle eyebrow="From ticket to keys" title="How a draw works" />
            <ol className="relative mt-14 grid gap-8 md:grid-cols-4 md:gap-5">
                <span className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-0.5 bg-gradient-to-r from-[#ff6a5c] via-[#c04cf0] to-violet md:block" aria-hidden="true" />
                {drawSteps.map(([t, d], k) => (
                    <li key={t} className="relative text-center">
                        <span className="num relative mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#ff6a5c] to-[#ff3d9a] text-lg font-extrabold text-white ring-8 ring-ink">{k + 1}</span>
                        <h3 className="mt-5 text-lg font-extrabold">{t}</h3>
                        <p className="mx-auto mt-2 max-w-[17rem] text-sm leading-relaxed text-cream/70">{d}</p>
                    </li>
                ))}
            </ol>
        </section>
    );
}

function FreeEntryBand({ company }) {
    return (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#24135a] via-[#3a1f8f] to-[#5b3be0] p-8 ring-1 ring-white/10 sm:p-12">
                <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-[#ff3d9a]/30 blur-3xl" aria-hidden="true" />
                <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
                    <div>
                        <p className="text-sm font-semibold text-[#ff9aa6]">No purchase necessary</p>
                        <h2 className="font-wide mt-2 text-3xl uppercase leading-[1.02] sm:text-4xl">Play for free, win for real</h2>
                        <p className="mt-4 max-w-xl text-white/80">Send us a free entry request for any competition. Free tickets go into exactly the same draw with exactly the same chance as paid ones. One per person per competition.</p>
                    </div>
                    <div className="flex flex-wrap gap-3 lg:justify-end">
                        <Link href="/free-entry" className="btn btn-white px-7">Request a free entry</Link>
                        <Link href="/terms#free-entry" className="btn btn-ghost border-white/30 px-7">Free entry rules</Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

function RecentEntries({ entries }) {
    if (!entries.length) return null;
    return (
        <div className="mt-8 rounded-3xl bg-white/[0.03] p-5 ring-1 ring-white/10">
            <h3 className="flex items-center gap-2 text-sm font-bold">
                <span className="h-2 w-2 rounded-full bg-jade" aria-hidden="true" /> Latest entries
            </h3>
            <ul className="mt-3 grid gap-x-8 gap-y-2.5 md:grid-cols-2">
                {entries.map((e) => (
                    <li key={e.id} className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate">
                            <PlayerName name={e.name} id={e.player_id} className="font-semibold" />
                            <span className="text-mist"> from {e.city} entered </span>
                            <Link href={`/raffles/${e.slug}`} className="hover:text-violet-hi">{e.raffle}</Link>
                            <span className="num text-mist"> ({number(e.quantity)})</span>
                        </span>
                        <span className="shrink-0 text-xs text-mist">{timeAgo(e.at)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

const faqs = [
    ['How much does a ticket cost?', 'Tickets start at 10c. The price and the maximum number of tickets are shown on every competition before you buy.'],
    ['Can I enter without paying?', 'Yes. Every competition has a free entry route. Free entries go into the same draw with the same odds.'],
    ['How are winners picked?', 'By a cryptographically secure random number generator, across every ticket issued for that competition. Results are published with the ticket number.'],
    ['What is an instant win?', 'A prize hidden behind a ticket number before sales open. If you’re issued that number, you win it immediately.'],
    ['Can I take cash instead?', 'Where a cash alternative is listed, the winner chooses.'],
    ['Who can play?', 'Anyone 18 or over living in a country where taking part is allowed. See our Terms for the full list.'],
];

function Faq() {
    return (
        <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionTitle eyebrow="Good to know" title="Questions" />
            <div className="mt-10 divide-y divide-white/10 overflow-hidden rounded-3xl bg-white/[0.03] ring-1 ring-white/10">
                {faqs.map(([q, a]) => (
                    <details key={q} className="faq group px-6 py-5">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
                            {q}
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/5 text-[#ff7a8a] transition-transform duration-200 ease-out group-open:rotate-45" aria-hidden="true">+</span>
                        </summary>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cream/75">{a}</p>
                    </details>
                ))}
            </div>
        </section>
    );
}


function Hero({ featured, heroArt, cur }) {
    return (
        <section className="relative isolate overflow-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
                <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_78%_40%,rgba(123,92,250,0.45),transparent_60%),radial-gradient(700px_420px_at_10%_0%,rgba(255,61,154,0.18),transparent_60%),linear-gradient(180deg,#1b0d3d_0%,#0d0a12_100%)]" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink to-transparent" />
            </div>
            <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-28 lg:pt-20">
                <div className="stagger">
                    <p className="text-sm font-semibold text-[#ff7a8a]">Your chance to win starts at 10c</p>
                    <h1 className="font-wide mt-3 text-[3.4rem] uppercase leading-[0.92] sm:text-7xl lg:text-[6.2rem]">
                        Big wins.
                        <br />
                        Small tickets.
                    </h1>
                    <p className="mt-6 max-w-lg text-lg text-cream/75">
                        Cars, watches, tech and cash. Every competition has a fixed number of tickets and a published draw date, and every one can be entered for free.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <CtaButton href={featured ? `/raffles/${featured.slug}` : '/raffles'}>Participate now</CtaButton>
                        <Link href="/raffles" className="btn btn-ghost px-7">All competitions</Link>
                    </div>
                </div>

                {featured && (
                    <div className="relative mx-auto w-full max-w-[520px]">
                        {heroArt ? (
                            <img src={heroArt} alt="" className="relative z-10 w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.55)]" />
                        ) : (
                            <Link href={`/raffles/${featured.slug}`} className="group relative z-10 block">
                                <div className="absolute -inset-6 rounded-full bg-violet/40 blur-3xl" aria-hidden="true" />
                                <div className="relative aspect-square overflow-hidden rounded-full border-[6px] border-white/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]">
                                    <Media src={featured.image_url} category={featured.category} title={featured.title} className="transition-transform duration-300 ease-out group-hover:scale-[1.03]" />
                                </div>
                            </Link>
                        )}
                        {/* Floating facts about the featured prize */}
                        <div className="absolute -left-2 top-[12%] z-20 rounded-2xl border border-white/10 bg-ink/80 px-4 py-3 shadow-xl backdrop-blur sm:-left-8">
                            <p className="text-xs text-mist">Featured prize</p>
                            <p className="max-w-[12rem] text-sm font-bold leading-tight">{featured.title}</p>
                        </div>
                        <div className="absolute -right-2 top-[48%] z-20 rounded-2xl bg-gradient-to-br from-[#ff6a5c] to-[#ff3d9a] px-4 py-3 text-white shadow-xl sm:-right-6">
                            <p className="text-xs text-white/80">Tickets from</p>
                            <p className="num text-2xl font-extrabold leading-none">{money(featured.ticket_price_cents, cur)}</p>
                        </div>
                        <div className="absolute bottom-[4%] left-[8%] z-20 w-64 rounded-2xl border border-white/10 bg-ink/85 p-3 shadow-xl backdrop-blur">
                            <p className="mb-2 text-xs text-mist">Draw {date(featured.draws_at)}</p>
                            <MiniCountdown to={featured.draws_at} />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

const howSteps = [
    ['Choose', 'Create your free account and pick the competition you want to win.', 'M4 7h16M4 12h16M4 17h10'],
    ['Buy', 'Choose how many tickets, from 10c each. Your numbers are random and shown instantly.', 'M3 8h18l-1.6 10.4A2 2 0 0 1 17.4 20H6.6a2 2 0 0 1-2-1.6zM8 8V6a4 4 0 0 1 8 0v2'],
    ['Win', 'Instant wins pay out straight away. The main prize is drawn at random on the published date.', 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 6h3v1a3 3 0 0 1-3 3M7 6H4v1a3 3 0 0 0 3 3'],
];

function HowToPlay() {
    return (
        <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionTitle eyebrow="Need to know about" title="How to play" intro="Three steps, then it’s down to luck." align="left" />
            <ol className="mt-12 grid gap-5 md:grid-cols-3">
                {howSteps.map(([t, d, icon], k) => (
                    <li key={t} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3a1f8f] to-[#24135a] p-7 ring-1 ring-white/10">
                        <span className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-sm font-extrabold">{pad(k + 1)}</span>
                        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#ff6a5c] to-[#ff3d9a] text-white shadow-lg">
                            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
                        </span>
                        <h3 className="font-wide mt-6 text-2xl uppercase">{t}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-cream/75">{d}</p>
                    </li>
                ))}
            </ol>
        </section>
    );
}

const groups = [
    ['all', 'All', () => true],
    ['cash', 'Cash', (r) => r.category === 'cash'],
    ['cars', 'Cars', (r) => r.category === 'cars'],
    ['lifestyle', 'Lifestyle', (r) => !['cash', 'cars'].includes(r.category)],
];

function ContestCard({ r, cur }) {
    return (
        <Link href={`/raffles/${r.slug}`} className="group flex flex-col overflow-hidden rounded-3xl bg-gradient-to-b from-[#5b3be0] to-[#3b23a8] p-3 ring-1 ring-white/10 transition-[scale] duration-200 ease-out active:scale-[0.99]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white">
                <Media src={r.image_url} category={r.category} title={r.title} className="transition-transform duration-300 ease-out group-hover:scale-[1.03]" />
                {r.instant_left > 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-amber px-2.5 py-1 text-[11px] font-bold text-ink">{r.instant_left} instant wins</span>
                )}
            </div>
            <div className="flex flex-1 flex-col px-2 pb-1 pt-4">
                <h3 className="text-base font-bold leading-snug text-white">Win {r.title}</h3>
                <p className="num mt-2 text-lg font-extrabold text-[#7dffb2]">{money(r.ticket_price_cents, cur)}</p>
                <p className="text-xs text-white/65">per ticket, {r.cash_alternative_cents ? `or ${money(r.cash_alternative_cents, cur, { compact: true })} cash` : `worth ${money(r.retail_value_cents, cur, { compact: true })}`}</p>
                <p className="mt-3 text-xs text-white/65">Draw on {date(r.draws_at)}</p>
                <div className="mt-2"><MiniCountdown to={r.draws_at} /></div>
            </div>
        </Link>
    );
}

function CurrentContest({ raffles, cur }) {
    const [g, setG] = useState('all');
    const list = useMemo(() => raffles.filter(groups.find((x) => x[0] === g)[2]), [g, raffles]);

    return (
        <section className="relative overflow-hidden py-20">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(800px_400px_at_50%_0%,rgba(123,92,250,0.25),transparent_70%)]" aria-hidden="true" />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <SectionTitle eyebrow="Try your chance at winning" title="Current contests" intro="Players buy tickets and the winner is drawn at random on the published date." />
                <div className="mt-8 flex flex-wrap justify-center gap-2" role="tablist">
                    {groups.map(([key, label, f]) => {
                        const count = raffles.filter(f).length;
                        if (!count) return null;
                        return (
                            <button
                                key={key}
                                role="tab"
                                aria-selected={g === key}
                                onClick={() => setG(key)}
                                className={`pressable rounded-full px-5 py-2 text-sm font-bold ${g === key ? 'bg-gradient-to-r from-[#ff6a5c] to-[#ff3d9a] text-white' : 'bg-white/5 text-cream/80 ring-1 ring-white/10 hover:text-white'}`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
                <div key={g} className="stagger mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {list.slice(0, 6).map((r) => <ContestCard key={r.id} r={r} cur={cur} />)}
                </div>
                <div className="mt-10 flex justify-center">
                    <Link href="/raffles" className="btn btn-ghost px-8">Browse more</Link>
                </div>
            </div>
        </section>
    );
}

function TopWinner({ w, cur }) {
    if (!w?.winner) return null;
    return (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionTitle eyebrow="Our biggest win so far" title="Top winner" />
            <div className="relative mt-12 overflow-hidden rounded-[28px] ring-1 ring-white/10">
                <div className="aspect-[16/10] sm:aspect-[21/8]">
                    <Media src={w.winner_photo_url ?? w.image_url} category={w.category} title={w.title} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 sm:p-10">
                    <p className="text-sm font-semibold text-[#ff7a8a]">Won {w.title}</p>
                    <p className="font-wide mt-1 text-3xl uppercase sm:text-5xl">{money(w.retail_value_cents, cur, { compact: true })}</p>
                </div>
                <div className="absolute bottom-4 right-4 rounded-2xl bg-gradient-to-br from-[#ff6a5c] to-[#ff3d9a] px-5 py-4 text-white shadow-xl sm:bottom-8 sm:right-8">
                    <p className="text-lg font-extrabold leading-tight">
                        <PlayerName name={w.winner.name} id={w.winner.player_id} className="" />
                    </p>
                    <p className="text-sm text-white/85">{w.winner.city}</p>
                    <p className="num mt-1 text-xs text-white/80">Ticket #{number(w.winner.number)}, drawn {date(w.drawn_at)}</p>
                </div>
            </div>
        </section>
    );
}

function LatestWinners({ drawn, instant, cur }) {
    if (!drawn.length && !instant.length) return null;
    return (
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
            <SectionTitle eyebrow="Meet the latest winners" title="Latest winners" intro="Every result is published with the winning ticket number." />
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
                {drawn.length > 0 && (
                    <div className="rounded-3xl bg-white/[0.03] p-5 ring-1 ring-white/10">
                        <h3 className="mb-4 font-bold">Main draws</h3>
                        <ul className="space-y-2.5">
                            {drawn.slice(0, 5).map((r) => (
                                <li key={r.id}>
                                    <Link href={`/raffles/${r.slug}`} className="grid grid-cols-[64px_1fr_auto] items-center gap-3 rounded-2xl bg-panel px-3 py-2.5 hover:bg-panel-2">
                                        <span className="aspect-square overflow-hidden rounded-xl"><Media src={r.image_url} category={r.category} title="" /></span>
                                        <span className="min-w-0">
                                            <span className="block truncate font-semibold">{r.title}</span>
                                            <span className="block truncate text-xs text-mist">
                                                {r.winner ? <><PlayerName name={r.winner.name} id={r.winner.player_id} nested className="text-cream" />, {r.winner.city}</> : 'Drawn'}
                                            </span>
                                        </span>
                                        <span className="num text-right text-xs text-mist">#{number(r.winner?.number)}<br />{date(r.drawn_at)}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {instant.length > 0 && (
                    <div className="rounded-3xl bg-white/[0.03] p-5 ring-1 ring-white/10">
                        <h3 className="mb-4 font-bold">Instant wins</h3>
                        <ul className="space-y-2.5">
                            {instant.slice(0, 5).map((w) => (
                                <li key={w.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl bg-panel px-3 py-2.5">
                                    <span className={`num grid h-12 min-w-16 place-items-center rounded-xl px-2 text-sm font-extrabold ${w.type === 'cash' ? 'bg-amber text-ink' : 'bg-violet text-white'}`}>
                                        {w.type === 'cash' ? money(w.value_cents, cur, { compact: true }).replace('.00', '') : 'Prize'}
                                    </span>
                                    <span className="min-w-0 text-sm">
                                        <span className="block truncate"><PlayerName name={w.name} id={w.player_id} /> from {w.city}</span>
                                        <span className="block truncate text-xs text-mist">won {w.title}</span>
                                    </span>
                                    <span className="text-xs text-mist">{timeAgo(w.won_at)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            <div className="mt-10 flex justify-center">
                <Link href="/winners" className="btn btn-ghost px-8">See all winners</Link>
            </div>
        </section>
    );
}

function Numbers({ stats, cur, entries }) {
    const items = [
        [number(stats.players), 'Registered players', 'M16 19v-1a4 4 0 0 0-8 0v1M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6'],
        [number(stats.tickets), 'Tickets issued', 'M4 7a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v10a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2z'],
        [number(stats.prizes_won), 'Prizes won', 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z'],
        [money(stats.value_won_cents, cur, { compact: true }), 'Won so far', 'M12 3v18M17 7.5c-1-1.5-3-2-5-2-2.5 0-4 1.2-4 3s1.5 2.6 4 3 4 1.4 4 3.2-1.8 3-4.4 3c-2 0-3.8-.6-4.6-2'],
    ];
    if (!stats.tickets) return null;
    return (
        <section className="relative overflow-hidden py-20">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(700px_380px_at_50%_100%,rgba(255,61,154,0.16),transparent_70%)]" aria-hidden="true" />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <SectionTitle eyebrow="Live from our database" title="Let the numbers speak" />
                <dl className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {items.map(([v, l, icon]) => (
                        <div key={l} className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-[#5b3be0] to-[#3b23a8] px-5 py-5 ring-1 ring-white/10">
                            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15">
                                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
                            </span>
                            <span>
                                <dd className="num text-2xl font-extrabold leading-none">{v}</dd>
                                <dt className="mt-1 text-xs text-white/70">{l}</dt>
                            </span>
                        </div>
                    ))}
                </dl>
                <RecentEntries entries={entries} />
            </div>
        </section>
    );
}

const features = [
    ['Free entry route', 'Every competition can be entered for free once. Same draw, same odds.', 'M4 12h16M12 4v16'],
    ['Fixed odds', 'The maximum number of tickets is shown before you buy. It never goes up.', 'M4 20V10M10 20V4M16 20v-7M22 20H2'],
    ['Random, recorded draws', 'Winners are picked by a secure random number generator and published with the ticket number.', 'M12 3l7 4v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V7z'],
    ['Real support', 'Real people answer every email, usually the same day.', 'M4 13v-1a8 8 0 0 1 16 0v1M4 13h3v5H5a1 1 0 0 1-1-1zM20 13h-3v5h2a1 1 0 0 0 1-1z'],
];

function Features() {
    return (
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
            <div className="grid gap-4 sm:grid-cols-2">
                {features.map(([t, d, icon], k) => (
                    <div key={t} className={`rounded-3xl p-6 ring-1 ring-white/10 ${k % 3 === 0 ? 'bg-gradient-to-br from-[#ff6a5c]/90 to-[#ff3d9a]/90' : 'bg-gradient-to-br from-[#5b3be0] to-[#3b23a8]'} ${k % 2 === 1 ? 'sm:translate-y-8' : ''}`}>
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
                            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
                        </span>
                        <h3 className="mt-4 text-lg font-extrabold">{t}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-white/80">{d}</p>
                    </div>
                ))}
            </div>
            <div>
                <SectionTitle eyebrow="Why play with us" title="Fair by design" align="left" intro="Prize competitions only work if players trust them. These are the rules we hold ourselves to, written into our Terms." />
                <Link href="/terms" className="mt-7 inline-block text-sm font-semibold text-[#ff7a8a] underline underline-offset-4">Read the Terms &amp; Conditions</Link>
            </div>
        </section>
    );
}

function Stories({ stories }) {
    if (!stories.length) return null;
    return (
        <section className="relative overflow-hidden py-20">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-[#2a1060]/60 to-transparent" aria-hidden="true" />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <SectionTitle eyebrow="In their words" title="Our winners" />
                <div className="mt-12 grid gap-5 md:grid-cols-3">
                    {stories.map((s) => (
                        <figure key={s.id} className="rounded-3xl bg-gradient-to-br from-[#ff6a5c]/90 to-[#c0399f]/90 p-6 text-white ring-1 ring-white/10">
                            {s.photo_url && <img src={s.photo_url} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-white/60" />}
                            <blockquote className="mt-4 text-sm leading-relaxed">“{s.story}”</blockquote>
                            <figcaption className="mt-4 text-sm">
                                <span className="font-extrabold">{s.winner?.name}</span>, won {s.title}
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Support({ company }) {
    return (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionTitle eyebrow="Get in touch" title="Customer support" intro="Have a question or need a hand? We’re here." />
            <div className="mt-12 grid gap-5 md:grid-cols-2">
                <div className="flex items-start gap-5 rounded-3xl bg-gradient-to-br from-[#5b3be0] to-[#3b23a8] p-7 ring-1 ring-white/10">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15">
                        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16v12H4zM4 7l8 6 8-6" /></svg>
                    </span>
                    <div>
                        <h3 className="text-lg font-extrabold">Talk to our support team</h3>
                        <p className="mt-1 text-sm text-white/80">Email us about entries, payments or prizes.</p>
                        <a href={`mailto:${company.email}`} className="btn mt-5 bg-gradient-to-r from-[#ff6a5c] to-[#ff3d9a] text-white">Email support</a>
                    </div>
                </div>
                <div className="flex items-start gap-5 rounded-3xl bg-gradient-to-br from-[#5b3be0] to-[#3b23a8] p-7 ring-1 ring-white/10">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15">
                        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 7h6l2 2h10v10H3zM9 14h6" /></svg>
                    </span>
                    <div>
                        <h3 className="text-lg font-extrabold">Our guide to playing</h3>
                        <p className="mt-1 text-sm text-white/80">How draws, instant wins and free entries work.</p>
                        <Link href="/how-it-works" className="btn btn-white mt-5">Read the FAQ</Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function Landing({ heroArt, featured, raffles, topWinner, latestDrawn, instantWins, stories, stats, endingSoon, categories, instantPool, recentEntries }) {
    const { app, company } = usePage().props;
    const cur = app.currency;

    return (
        <SiteLayout>
            <Head title="Big wins, small tickets" />
            <Hero featured={featured} heroArt={heroArt} cur={cur} />
            <EndingSoon list={endingSoon} cur={cur} />
            <Categories items={categories} cur={cur} />
            <HowToPlay />
            <CurrentContest raffles={raffles} cur={cur} />
            <InstantPool pool={instantPool} cur={cur} />
            <TopWinner w={topWinner} cur={cur} />
            <LatestWinners drawn={latestDrawn} instant={instantWins} cur={cur} />
            <DrawTimeline />
            <FreeEntryBand company={company} />
            <Numbers stats={stats} cur={cur} entries={recentEntries} />
            <Features />
            <Stories stories={stories} />
            <Faq />
            <Support company={company} />
        </SiteLayout>
    );
}
