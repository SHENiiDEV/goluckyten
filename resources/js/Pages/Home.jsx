import { Head, Link, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SiteLayout from '../Layouts/SiteLayout';
import Media from '../Components/Media';
import RaffleCard from '../Components/RaffleCard';
import { CountdownPill } from '../Components/Countdown';
import PlayerName from '../Components/PlayerName';
import { date, money, number } from '../lib/format';

function timeAgo(iso) {
    const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} h ago`;
    return `${Math.round(h / 24)} d ago`;
}

function drawTime(iso) {
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function stripText(s) {
    const end = new Date(s.draws_at);
    const now = new Date();
    const days = Math.round((end - now) / 864e5);
    if (end.toDateString() === now.toDateString()) return ['Ends tonight', `Auto-drawn at ${drawTime(s.draws_at)}`];
    if (days <= 1) return ['Ends tomorrow', `Drawn at ${drawTime(s.draws_at)}`];
    if (s.promo_label) return [s.promo_label, `Drawn ${date(s.draws_at)}`];
    return [`${days} days left`, `Drawn ${date(s.draws_at)}`];
}

function HeroCarousel({ slides, hero, cur }) {
    const [i, setI] = useState(0);
    const [paused, setPaused] = useState(false);
    const n = slides.length;
    const go = useCallback((d) => setI((x) => (x + d + n) % n), [n]);

    useEffect(() => {
        if (paused || n < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const id = setInterval(() => go(1), 6500);
        return () => clearInterval(id);
    }, [paused, go, n]);

    // Drag follows the pointer 1:1, then hands off to the transition from wherever it was released.
    const drag = useRef(null);
    const moved = useRef(false);
    const [dx, setDx] = useState(0);
    const [dragging, setDragging] = useState(false);

    const onPointerDown = (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), w: e.currentTarget.offsetWidth, axis: null };
        moved.current = false;
    };
    const onPointerMove = (e) => {
        const d = drag.current;
        if (!d) return;
        const mx = e.clientX - d.x;
        const my = e.clientY - d.y;
        if (!d.axis) {
            if (Math.abs(mx) < 8 && Math.abs(my) < 8) return; // hysteresis before committing to a direction
            d.axis = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
            if (d.axis === 'x') {
                e.currentTarget.setPointerCapture(e.pointerId);
                setDragging(true);
            }
        }
        if (d.axis !== 'x') return;
        moved.current = true;
        // Rubber-band past the first and last slide instead of a hard stop.
        const atEdge = (i === 0 && mx > 0) || (i === n - 1 && mx < 0);
        setDx(atEdge ? (mx * d.w * 0.55) / (d.w + 0.55 * Math.abs(mx)) * 0.5 : mx);
    };
    const onPointerUp = (e) => {
        const d = drag.current;
        drag.current = null;
        if (!d || d.axis !== 'x') return;
        const mx = e.clientX - d.x;
        const velocity = Math.abs(mx) / Math.max(1, performance.now() - d.t);
        setDragging(false);
        setDx(0);
        if (Math.abs(mx) > d.w * 0.18 || velocity > 0.11) {
            if (mx < 0 && i < n - 1) setI(i + 1);
            if (mx > 0 && i > 0) setI(i - 1);
        }
    };

    if (!n) return null;

    return (
        <section className="relative overflow-hidden pb-10 pt-8 sm:pt-10" aria-roledescription="carousel" aria-label="Featured competitions">
            <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
                {hero.video ? (
                    <video className="h-full w-full object-cover opacity-25 blur-[2px]" src={hero.video} poster={hero.poster ?? undefined} autoPlay muted loop playsInline />
                ) : (
                    hero.poster && <img className="h-full w-full object-cover opacity-20 blur-sm" src={hero.poster} alt="" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-violet-deep/25 via-ink/70 to-ink" />
            </div>

            <div
                className="relative touch-pan-y select-none"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onFocus={() => setPaused(true)}
                onBlur={() => setPaused(false)}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onClickCapture={(e) => {
                    if (moved.current) {
                        e.preventDefault();
                        e.stopPropagation();
                        moved.current = false;
                    }
                }}
            >
                <div
                    className={`flex gap-4 [--w:88%] sm:[--w:80%] lg:[--w:64%] ${dragging ? '' : 'transition-transform duration-500 ease-in-out motion-reduce:duration-0'}`}
                    style={{ transform: `translateX(calc((100% - var(--w)) / 2 - ${i} * (var(--w) + 1rem) + ${dx}px))` }}
                >
                    {slides.map((s, k) => {
                        const [big, small] = stripText(s);
                        const active = k === i;
                        return (
                            <div key={s.id} className={`w-[var(--w)] shrink-0 transition-opacity duration-500 ease-in-out ${active ? 'opacity-100' : 'opacity-35'}`} aria-hidden={!active} role="group" aria-roledescription="slide" aria-label={`${k + 1} of ${n}`}>
                                <Link href={`/raffles/${s.slug}`} tabIndex={active ? 0 : -1} className="group relative block overflow-hidden rounded-[22px] border border-white/10 bg-ink-2">
                                    <div className="aspect-[4/3.4] sm:aspect-[16/8]">
                                        <Media src={s.image_url} category={s.category} title={s.title} />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
                                    <div className="absolute inset-x-0 top-4 flex justify-center">
                                        <CountdownPill to={s.draws_at} className="text-sm" />
                                    </div>
                                    <div className="absolute inset-x-0 bottom-[4rem] px-5 text-center sm:bottom-[5.4rem] sm:px-10">
                                        <p className="font-wide text-[1.7rem] uppercase leading-[0.95] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,.6)] sm:text-5xl lg:text-[3.6rem]">
                                            {s.headline ?? `Win ${s.title}`}
                                        </p>
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 bg-violet px-4 py-2 text-center sm:py-3">
                                        <p className="font-strip text-xl leading-none text-white sm:text-3xl">{big}</p>
                                        <p className="font-strip mt-0.5 text-[11px] text-white/80 sm:text-sm">{small}</p>
                                    </div>
                                </Link>
                                <div className={`mt-4 text-center transition-opacity duration-300 ease-out ${active ? 'opacity-100' : 'opacity-0'}`}>
                                    <h2 className="text-xl font-bold sm:text-2xl">{s.title}</h2>
                                    <p className="mt-1 text-sm text-mist">
                                        {money(s.ticket_price_cents, cur)} per ticket
                                        {s.cash_alternative_cents ? `, or take ${money(s.cash_alternative_cents, cur, { compact: true })} cash` : ''}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {n > 1 && (
                    <>
                        <button onClick={() => go(-1)} className="pressable absolute left-3 top-[38%] hidden h-12 w-12 place-items-center rounded-full bg-ink/70 text-white backdrop-blur hover:bg-violet sm:grid" aria-label="Previous competition">
                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 5l-7 7 7 7" /></svg>
                        </button>
                        <button onClick={() => go(1)} className="pressable absolute right-3 top-[38%] hidden h-12 w-12 place-items-center rounded-full bg-ink/70 text-white backdrop-blur hover:bg-violet sm:grid" aria-label="Next competition">
                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg>
                        </button>
                        <div className="mt-5 flex justify-center gap-2">
                            {slides.map((s, k) => (
                                <button key={s.id} onClick={() => setI(k)} className="grid h-6 w-8 place-items-center" aria-label={`Show ${s.title}`} aria-current={k === i}>
                                    <span className={`block h-2 w-8 origin-center rounded-full transition-[scale,background-color] duration-300 ease-out ${k === i ? 'scale-x-100 bg-violet' : 'scale-x-25 bg-line-2'}`} />
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}

const trust = [
    ['Free entry on every competition', 'No purchase necessary', 'M4 12h16M12 4v16'],
    ['Instant wins paid within 24 hours', 'Straight to your bank', 'M13 2L4 14h7l-1 8 9-12h-7z'],
    ['Fixed ticket limits', 'Your odds, shown up front', 'M4 20V10M10 20V4M16 20v-7M22 20H2'],
    ['Random, recorded draws', 'Every result published', 'M12 3l7 4v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V7z'],
];

function TrustBar() {
    return (
        <section className="border-y border-line bg-ink-2">
            <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-line lg:grid-cols-4">
                {trust.map(([t, s, d]) => (
                    <li key={t} className="flex items-center gap-3 bg-ink-2 px-4 py-4 sm:px-6">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet/15 text-violet-hi">
                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
                        </span>
                        <span>
                            <span className="block text-sm font-bold leading-tight">{t}</span>
                            <span className="block text-xs text-mist">{s}</span>
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}

const tabs = [
    ['ending', 'Ending soon', () => true],
    ['jackpot', 'Jackpot prizes', (r) => r.retail_value_cents >= 5000000],
    ['instant', 'Instant wins', (r) => r.instant_total > 0],
    ['cars', 'Cars', (r) => r.category === 'cars'],
    ['luxury', 'Watches & jewellery', (r) => ['watches', 'jewellery'].includes(r.category)],
    ['odds', 'Best odds', (r) => r.max_tickets <= 2000000],
];

function Competitions({ raffles }) {
    const [tab, setTab] = useState('ending');
    const list = useMemo(() => {
        const [, , f] = tabs.find((t) => t[0] === tab);
        return raffles.filter(f);
    }, [tab, raffles]);

    return (
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8" id="competitions">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="font-display text-3xl sm:text-4xl">Live competitions</h2>
                <Link href="/raffles" className="text-sm font-semibold text-violet-hi hover:underline">View all {raffles.length}</Link>
            </div>
            <div className="no-scrollbar -mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <div className="inline-flex gap-1 rounded-xl border border-line bg-ink-2 p-1" role="tablist" aria-label="Filter competitions">
                    {tabs.map(([key, label, f]) => {
                        const count = raffles.filter(f).length;
                        return (
                            <button
                                key={key}
                                role="tab"
                                aria-selected={tab === key}
                                onClick={() => setTab(key)}
                                disabled={!count}
                                className={`pressable whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40 ${tab === key ? 'bg-violet text-white' : 'text-cream/80 hover:bg-panel hover:text-white'}`}
                            >
                                {label}
                                <span className={`num ml-1.5 text-xs ${tab === key ? 'text-white/70' : 'text-mist'}`}>{count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
            <div key={tab} className="stagger mt-9 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
                {list.map((r) => (
                    <RaffleCard key={r.id} raffle={r} />
                ))}
            </div>
        </section>
    );
}

function InstantFeed({ wins, raffles, cur }) {
    if (!wins.length) return null;
    const instantRaffle = raffles.filter((r) => r.instant_left > 0).sort((a, b) => b.instant_left - a.instant_left)[0];
    return (
        <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-violet-deep/35 via-panel to-panel">
                <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="flex flex-col justify-center p-7 sm:p-10">
                        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber px-3 py-1 text-xs font-bold text-ink">
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg>
                            Instant wins
                        </span>
                        <h2 className="font-display mt-4 text-3xl leading-tight sm:text-4xl">Win the moment you buy</h2>
                        <p className="mt-4 max-w-md text-cream/75">
                            Cash and prizes are hidden behind ticket numbers before sales open. Land on one and it shows on your order page straight away. Your ticket still goes into the main draw.
                        </p>
                        {instantRaffle && (
                            <Link href={`/raffles/${instantRaffle.slug}`} className="btn btn-primary mt-7 w-fit">
                                Play {instantRaffle.title}
                            </Link>
                        )}
                    </div>
                    <div className="border-t border-line bg-ink/40 p-4 sm:p-6 lg:border-l lg:border-t-0">
                        <h3 className="mb-3 flex items-center gap-2 px-1 text-sm font-bold">
                            <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-jade opacity-60 motion-reduce:hidden" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-jade" /></span>
                            Just won
                        </h3>
                        <ul className="space-y-2">
                            {wins.slice(0, 6).map((w) => (
                                <li key={w.id}>
                                    <Link href={`/raffles/${w.raffle_slug}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl bg-panel/80 px-3 py-2.5 hover:bg-panel-2">
                                        <span className={`num grid h-10 min-w-16 place-items-center rounded-lg px-2 text-sm font-extrabold ${w.type === 'cash' ? 'bg-amber text-ink' : 'bg-violet text-white'}`}>
                                            {w.type === 'cash' ? money(w.value_cents, cur, { compact: true }).replace('.00', '') : 'Prize'}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm"><PlayerName name={w.name} id={w.player_id} nested /> from {w.city} won {w.title}</span>
                                            <span className="block truncate text-xs text-mist">{w.raffle}</span>
                                        </span>
                                        <span className="whitespace-nowrap text-xs text-mist">{timeAgo(w.won_at)}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Winners({ winners, stats, cur }) {
    if (!winners.length) return null;
    return (
        <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h2 className="font-display text-3xl sm:text-4xl">Our winners</h2>
                    <p className="mt-2 text-mist">{money(stats.prize_value_cents, cur, { compact: true })} in prizes won so far, including {number(stats.instant_won)} instant wins.</p>
                </div>
                <Link href="/winners" className="text-sm font-semibold text-violet-hi hover:underline">All winners</Link>
            </div>
            <div className="no-scrollbar -mx-4 mt-8 flex snap-x gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
                {winners.slice(0, 3).map((w) => (
                    <Link key={w.id} href={`/raffles/${w.slug}`} className="group w-[82%] shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-panel sm:w-auto">
                        <div className="relative aspect-[4/3] overflow-hidden">
                            <Media src={w.winner_photo_url ?? w.image_url} category={w.category} title={w.title} className="transition-transform duration-300 ease-out group-hover:scale-[1.03]" />
                            <span className="absolute left-3 top-3 rounded-md bg-jade px-2.5 py-1 text-xs font-bold text-ink">Winner</span>
                        </div>
                        <div className="p-5">
                            <div className="flex items-baseline justify-between gap-3">
                                <p className="text-lg font-bold"><PlayerName name={w.winner_name} id={w.winner_player_id} nested /><span className="font-normal text-mist">, {w.winner_city}</span></p>
                                <p className="text-xs text-mist">{date(w.drawn_at)}</p>
                            </div>
                            <p className="mt-1 text-sm font-semibold text-violet-hi">{w.title}</p>
                            <p className="mt-3 line-clamp-3 text-sm text-cream/75">
                                {w.winner_story ?? `Ticket #${w.winner_number} was drawn from ${number(w.tickets_sold)} entries${w.winner_entry === 'free' ? ', entered for free' : ''}.`}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}

const steps = [
    ['Choose a competition', 'Cars, watches, tech or cash. Every page shows the ticket limit, the price and the exact draw time.'],
    ['Pick your tickets', 'Choose how many, or send a free entry request. Your numbers are random and shown instantly, along with any instant wins.'],
    ['Watch the draw', 'The winner is picked at random at the advertised time and announced on the winners page. Prizes are delivered free.'],
];

const faq = [
    ['Do I have to pay to enter?', 'No. Every competition can be entered once for free using our free entry route. Free entries have exactly the same chance of winning.'],
    ['How are winners chosen?', 'With a cryptographically secure random number generator across every ticket issued for that competition.'],
    ['What is an instant win?', 'Some competitions hide prizes behind ticket numbers chosen in secret before sales open. If you’re issued one of those numbers, you win it immediately.'],
    ['What are my odds?', 'Your tickets divided by tickets issued. The maximum is always shown, so your odds are never worse than your tickets divided by that number.'],
    ['Can I take cash instead of the prize?', 'Where a cash alternative is listed, yes. The winner decides.'],
    ['Who can play?', 'Anyone 18 or over living in a country where taking part is allowed. A few countries are excluded; see our Terms.'],
];

function HowAndFaq({ company }) {
    return (
        <>
            <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
                <h2 className="font-display text-3xl sm:text-4xl">How it works</h2>
                <ol className="mt-8 grid gap-5 md:grid-cols-3">
                    {steps.map(([t, d], k) => (
                        <li key={t} className="relative rounded-2xl border border-line bg-panel p-6">
                            <span className="font-wide num text-5xl text-violet/60">{k + 1}</span>
                            <h3 className="mt-3 text-lg font-bold">{t}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-cream/75">{d}</p>
                        </li>
                    ))}
                </ol>
            </section>

            <section className="mx-auto grid max-w-7xl gap-8 px-4 pt-20 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:px-8">
                <div>
                    <h2 className="font-display text-3xl sm:text-4xl">Questions</h2>
                    <div className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
                        {faq.map(([q, a]) => (
                            <details key={q} className="faq group px-5 py-4">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                                    {q}
                                    <svg viewBox="0 0 12 8" className="h-2 w-3 shrink-0 text-violet-hi transition-transform duration-200 ease-out group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 1.5l5 5 5-5" /></svg>
                                </summary>
                                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cream/75">{a}</p>
                            </details>
                        ))}
                    </div>
                </div>
                <aside className="h-fit rounded-2xl border border-line bg-gradient-to-br from-violet/25 to-panel p-7 lg:mt-[3.75rem]">
                    <h3 className="font-display text-2xl">Got a question?</h3>
                    <p className="mt-2 text-sm text-cream/75">Our team answers every email, usually the same day.</p>
                    <a href={`mailto:${company.email}`} className="btn btn-white mt-6 w-full">Email us</a>
                    <Link href="/how-it-works" className="btn btn-ghost mt-3 w-full">Read the full FAQ</Link>
                </aside>
            </section>
        </>
    );
}

export default function Home({ slides, raffles, winners, stats, hero, instantWins }) {
    const { app, company } = usePage().props;
    const cur = app.currency;

    return (
        <SiteLayout>
            <Head title="Win cars, watches and cash" />
            <HeroCarousel slides={slides} hero={hero} cur={cur} />
            <div className="flex justify-center pb-10">
                <a href="#competitions" className="btn btn-primary px-8">See all live competitions</a>
            </div>
            <TrustBar />
            <Competitions raffles={raffles} />
            <InstantFeed wins={instantWins} raffles={raffles} cur={cur} />
            <Winners winners={winners} stats={stats} cur={cur} />
            <HowAndFaq company={company} />
        </SiteLayout>
    );
}
