import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import StatusBadge from '../../Components/StatusBadge';
import { dateTime, money, number } from '../../lib/format';

export default function Dashboard({ stats, readyToDraw, recentOrders }) {
    const cur = usePage().props.app.currency;
    const tiles = [
        ['Revenue, all time', money(stats.revenue_cents, cur)],
        ['Revenue, last 30 days', money(stats.revenue_30d_cents, cur)],
        ['Tickets issued', `${number(stats.tickets)}`, `${number(stats.free_tickets)} free`],
        ['Players', number(stats.users)],
        ['Live raffles', number(stats.live)],
    ];

    return (
        <AdminLayout title="Overview" actions={<Link href="/admin/raffles/create" className="btn btn-gold btn-sm">New raffle</Link>}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {tiles.map(([label, value, sub]) => (
                    <div key={label} className="card p-5">
                        <div className="text-xs text-mist">{label}</div>
                        <div className="num mt-2 font-display text-2xl">{value}</div>
                        {sub && <div className="mt-1 text-xs text-mist">{sub}</div>}
                    </div>
                ))}
            </div>

            {stats.pending_free > 0 && (
                <Link href="/admin/free-entries" className="mt-6 flex items-center justify-between rounded-2xl border border-gold-deep/60 bg-gold/5 px-5 py-4 hover:bg-gold/10">
                    <span><span className="num font-bold text-gold-hi">{stats.pending_free}</span> free entry {stats.pending_free === 1 ? 'request is' : 'requests are'} waiting for review</span>
                    <span className="text-sm text-gold-hi">Review</span>
                </Link>
            )}

            <div className="mt-10 grid gap-8 lg:grid-cols-2">
                <div>
                    <h2 className="font-display text-xl">Ready to draw</h2>
                    {readyToDraw.length ? (
                        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line">
                            {readyToDraw.map((r) => (
                                <li key={r.id}>
                                    <Link href={`/admin/raffles/${r.slug}`} className="flex items-center justify-between gap-4 bg-panel/50 px-4 py-3 hover:bg-panel">
                                        <span>
                                            <span className="block">{r.title}</span>
                                            <span className="num text-xs text-mist">{number(r.tickets_sold)} tickets, draw {dateTime(r.draws_at)}</span>
                                        </span>
                                        <StatusBadge status={r.status} />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-4 text-sm text-mist">No raffles are waiting for a draw.</p>
                    )}
                </div>
                <div>
                    <h2 className="font-display text-xl">Latest orders</h2>
                    <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line">
                        {recentOrders.map((o) => (
                            <li key={o.reference} className="flex items-center justify-between gap-4 bg-panel/50 px-4 py-3 text-sm">
                                <span className="min-w-0">
                                    <span className="block truncate">{o.user}</span>
                                    <span className="num text-xs text-mist">{o.reference}, {dateTime(o.created_at)}</span>
                                </span>
                                <span className="num">{money(o.total_cents, cur)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </AdminLayout>
    );
}
