import { Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import StatusBadge from '../../../Components/StatusBadge';
import { dateTime, money, number, pct } from '../../../lib/format';

const statuses = [[null, 'All'], ['live', 'Live'], ['draft', 'Draft'], ['closed', 'Closed'], ['drawn', 'Drawn']];

export default function Index({ raffles, filters }) {
    const cur = usePage().props.app.currency;
    return (
        <AdminLayout title="Raffles" actions={<Link href="/admin/raffles/create" className="btn btn-gold btn-sm">New raffle</Link>}>
            <div className="mb-5 flex flex-wrap gap-2">
                {statuses.map(([v, l]) => (
                    <button key={l} onClick={() => router.get('/admin/raffles', v ? { status: v } : {}, { preserveState: true })} className={`rounded-full border px-3.5 py-1.5 text-sm ${filters.status === v ? 'border-gold text-gold-hi' : 'border-line text-cream/80'}`}>
                        {l}
                    </button>
                ))}
            </div>
            <div className="overflow-x-auto rounded-2xl border border-line">
                <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-panel text-left text-xs text-mist">
                        <tr>
                            <th className="px-4 py-3 font-medium">Raffle</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Price</th>
                            <th className="px-4 py-3 font-medium">Sold</th>
                            <th className="px-4 py-3 font-medium">Draw</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {raffles.map((r) => (
                            <tr key={r.id} className="bg-panel/40 hover:bg-panel/80">
                                <td className="px-4 py-3">
                                    <Link href={`/admin/raffles/${r.slug}`} className="font-semibold hover:text-gold-hi">{r.title}</Link>
                                    <div className="text-xs text-mist">{r.category_label}{r.featured ? ', featured' : ''}</div>
                                </td>
                                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                                <td className="num px-4 py-3">{money(r.ticket_price_cents, cur)}</td>
                                <td className="num px-4 py-3">{number(r.tickets_sold)} / {number(r.max_tickets)} <span className="text-mist">({pct(r.tickets_sold, r.max_tickets)}%)</span></td>
                                <td className="num px-4 py-3 text-cream/80">{dateTime(r.draws_at)}</td>
                                <td className="px-4 py-3 text-right"><Link href={`/admin/raffles/${r.slug}/edit`} className="text-gold-hi hover:underline">Edit</Link></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {raffles.length === 0 && <p className="p-8 text-center text-mist">No raffles match this filter.</p>}
            </div>
        </AdminLayout>
    );
}
