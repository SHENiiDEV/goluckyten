import { Head, Link } from '@inertiajs/react';
import SiteLayout from '../../Layouts/SiteLayout';
import Media from '../../Components/Media';
import Progress from '../../Components/Progress';
import StatusBadge from '../../Components/StatusBadge';
import { date, number } from '../../lib/format';
import timeAgo from '../../lib/timeAgo';

export default function Show({ player, stats, entries, wins, isOwner }) {
    return (
        <SiteLayout>
            <Head title={`${player.name}`} />
            <section className="border-b border-line bg-gradient-to-b from-violet-deep/25 to-transparent">
                <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 lg:px-8">
                    {isOwner && !player.is_public && (
                        <p className="mb-6 rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-cream/90">
                            Only you can see this page. <Link href="/account/profile" className="font-semibold text-amber underline">Make your profile public</Link> to show it to other players.
                        </p>
                    )}
                    <div className="flex flex-wrap items-center gap-5">
                        <div className="grid h-20 w-20 place-items-center rounded-2xl bg-violet text-3xl font-extrabold text-white" aria-hidden="true">{player.initials}</div>
                        <div>
                            <h1 className="font-wide text-3xl sm:text-4xl">{player.name}</h1>
                            <p className="mt-1 text-mist">{player.city}, {player.country}. Playing since {date(player.since)}</p>
                        </div>
                    </div>
                    <dl className="mt-8 grid max-w-xl grid-cols-3 gap-3">
                        {[
                            ['Competitions', number(stats.competitions)],
                            ['Tickets', number(stats.tickets)],
                            ['Wins', number(stats.wins)],
                        ].map(([k, v]) => (
                            <div key={k} className="rounded-xl border border-line bg-panel px-4 py-3">
                                <dt className="text-xs text-mist">{k}</dt>
                                <dd className="num mt-0.5 text-2xl font-extrabold">{v}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            <section className="mx-auto grid max-w-6xl gap-10 px-4 pt-10 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:px-8">
                <div>
                    <h2 className="font-display text-2xl">Competitions entered</h2>
                    {entries.length ? (
                        <ul className="mt-5 space-y-3">
                            {entries.map((r) => (
                                <li key={r.id}>
                                    <Link href={`/raffles/${r.slug}`} className="pressable grid grid-cols-[96px_1fr] gap-4 rounded-2xl border border-line bg-panel p-3 hover:border-violet/60">
                                        <div className="aspect-[4/3] overflow-hidden rounded-lg">
                                            <Media src={r.image_url} category={r.category} title={r.title} />
                                        </div>
                                        <div className="min-w-0 py-0.5">
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="truncate font-bold">{r.title}</p>
                                                <StatusBadge status={r.status} />
                                            </div>
                                            <p className="mt-0.5 text-sm text-mist">
                                                <span className="num font-semibold text-cream">{number(r.my_tickets)}</span> {r.my_tickets === 1 ? 'ticket' : 'tickets'}, last entry {timeAgo(r.entered_at)}
                                            </p>
                                            {r.is_open && <div className="mt-2.5"><Progress sold={r.tickets_sold} max={r.max_tickets} showLabel={false} /></div>}
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-5 rounded-2xl border border-line bg-panel p-6 text-mist">No entries yet.</p>
                    )}
                </div>

                <aside>
                    <h2 className="font-display text-2xl">Wins</h2>
                    {wins.length ? (
                        <ul className="mt-5 space-y-2.5">
                            {wins.map((w, k) => (
                                <li key={k}>
                                    <Link href={`/raffles/${w.slug}`} className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-xl border border-line bg-panel px-3 py-3 hover:border-violet/60">
                                        <span className={`grid h-10 w-10 place-items-center rounded-lg text-sm font-extrabold ${w.kind === 'draw' ? 'bg-jade text-ink' : 'bg-amber text-ink'}`} aria-hidden="true">
                                            {w.kind === 'draw' ? '★' : '⚡'}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block truncate font-semibold">{w.title}</span>
                                            <span className="num block truncate text-xs text-mist">
                                                {w.kind === 'draw' ? 'Main draw' : `Instant win, ${w.raffle}`}, ticket #{number(w.number)}, {date(w.at)}
                                            </span>
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-5 rounded-2xl border border-line bg-panel p-6 text-mist">No wins yet. Every ticket is a chance.</p>
                    )}
                </aside>
            </section>
        </SiteLayout>
    );
}
