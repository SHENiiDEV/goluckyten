import { Head, Link, usePage } from '@inertiajs/react';
import SiteLayout from '../../Layouts/SiteLayout';
import AccountNav from './AccountNav';
import Media from '../../Components/Media';
import Countdown from '../../Components/Countdown';
import StatusBadge from '../../Components/StatusBadge';
import { date, dateTime, money } from '../../lib/format';

function Entry({ e }) {
    const r = e.raffle;
    const nums = e.numbers.slice(0, 40);
    const instant = e.instant_numbers ?? [];
    return (
        <li className={`card overflow-hidden ${e.won ? 'border-gold' : ''}`}>
            <div className="grid sm:grid-cols-[180px_1fr]">
                <Link href={`/raffles/${r.slug}`} className="block aspect-[4/3] sm:aspect-auto sm:h-full">
                    <Media src={r.image_url} category={r.category} title={r.title} />
                </Link>
                <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <Link href={`/raffles/${r.slug}`} className="font-display text-xl hover:text-gold-hi">{r.title}</Link>
                            <p className="mt-1 text-sm text-mist">
                                {r.status === 'drawn' ? `Drawn ${date(r.drawn_at)}` : <>Draw {dateTime(r.draws_at)}, <Countdown to={r.draws_at} size="sm" /></>}
                            </p>
                        </div>
                        {e.won ? <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-ink">You won</span> : <StatusBadge status={r.status} />}
                    </div>
                    <p className="mt-4 text-xs text-mist">
                        {e.numbers.length} {e.numbers.length === 1 ? 'ticket' : 'tickets'}{e.free_count > 0 ? `, ${e.free_count} free` : ''}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {nums.map((n) => (
                            <span key={n} className={`num rounded-md border px-2 py-0.5 text-xs ${n === e.winning_number || instant.includes(n) ? 'border-gold bg-gold text-ink' : 'border-gold-deep/40 text-gold-hi'}`}>{n}</span>
                        ))}
                        {e.numbers.length > 40 && <span className="px-1 text-xs text-mist">+{e.numbers.length - 40} more</span>}
                    </div>
                </div>
            </div>
        </li>
    );
}

export default function Dashboard({ entries, orders, freeEntries, summary, instantWins }) {
    const { auth, app } = usePage().props;
    const active = entries.filter((e) => e.raffle.status !== 'drawn');
    const past = entries.filter((e) => e.raffle.status === 'drawn');

    return (
        <SiteLayout>
            <Head title="My tickets" />
            <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
                <h1 className="font-display text-5xl">Hello, {auth.user.name}</h1>
                <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-sm">
                    <div><dt className="text-mist">Raffles entered</dt><dd className="num font-display text-3xl">{summary.active}</dd></div>
                    <div><dt className="text-mist">Tickets held</dt><dd className="num font-display text-3xl">{summary.tickets}</dd></div>
                    <div><dt className="text-mist">Wins</dt><dd className="num font-display text-3xl text-gold-hi">{summary.wins}</dd></div>
                </dl>
                <AccountNav />

                <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
                    <div>
                        <h2 className="font-display text-2xl">Upcoming draws</h2>
                        {active.length ? (
                            <ul className="mt-5 space-y-4">{active.map((e) => <Entry key={e.raffle.id} e={e} />)}</ul>
                        ) : (
                            <div className="card mt-5 p-8 text-center">
                                <p className="text-cream/80">You’re not in any upcoming draws.</p>
                                <Link href="/raffles" className="btn btn-gold mt-5">Find a raffle</Link>
                            </div>
                        )}
                        {past.length > 0 && (
                            <>
                                <h2 className="mt-12 font-display text-2xl">Past draws</h2>
                                <ul className="mt-5 space-y-4">{past.map((e) => <Entry key={e.raffle.id} e={e} />)}</ul>
                            </>
                        )}
                    </div>

                    <aside className="space-y-8">
                        {instantWins.length > 0 && (
                            <div>
                                <h2 className="font-display text-xl">Instant wins</h2>
                                <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-gold-deep/60">
                                    {instantWins.map((w) => (
                                        <li key={w.id} className="flex items-center justify-between gap-3 bg-gold/5 px-4 py-3 text-sm">
                                            <span className="min-w-0">
                                                <span className="block font-semibold text-gold-hi">{w.title}</span>
                                                <span className="num block truncate text-xs text-mist">#{w.ticket_number}, {w.raffle}</span>
                                            </span>
                                            <StatusBadge status={w.status === 'pending' ? 'processing' : w.status} />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div>
                            <h2 className="font-display text-xl">Orders</h2>
                            {orders.length ? (
                                <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line">
                                    {orders.map((o) => (
                                        <li key={o.reference}>
                                            <Link href={`/account/orders/${o.reference}`} className="flex items-center justify-between bg-panel/50 px-4 py-3 text-sm hover:bg-panel">
                                                <span>
                                                    <span className="num block">{o.reference}</span>
                                                    <span className="text-xs text-mist">{date(o.created_at)}</span>
                                                </span>
                                                <span className="num">{money(o.total_cents, app.currency)}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-3 text-sm text-mist">No orders yet.</p>
                            )}
                        </div>
                        <div>
                            <h2 className="font-display text-xl">Free entry requests</h2>
                            {freeEntries.length ? (
                                <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line">
                                    {freeEntries.map((f) => (
                                        <li key={f.reference} className="flex items-center justify-between gap-3 bg-panel/50 px-4 py-3 text-sm">
                                            <span className="min-w-0 truncate">{f.raffle}</span>
                                            <StatusBadge status={f.status} />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-3 text-sm text-mist">
                                    None yet. <Link href="/free-entry" className="text-gold-hi underline">Request a free entry</Link>
                                </p>
                            )}
                        </div>
                    </aside>
                </div>
            </section>
        </SiteLayout>
    );
}
