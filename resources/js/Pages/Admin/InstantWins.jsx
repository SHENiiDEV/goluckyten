import { Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import Pagination from '../../Components/Pagination';
import { dateTime, money } from '../../lib/format';

const tabs = [['pending', 'To pay out'], ['paid', 'Paid'], ['shipped', 'Shipped'], ['all', 'All']];

export default function InstantWins({ wins, filters }) {
    const cur = usePage().props.app.currency;
    const set = (id, status) => router.post(`/admin/instant-wins/${id}/fulfil`, { status }, { preserveScroll: true });

    return (
        <AdminLayout title="Instant wins">
            <div className="mb-6 flex flex-wrap gap-2">
                {tabs.map(([v, l]) => (
                    <button key={v} onClick={() => router.get('/admin/instant-wins', { status: v }, { preserveState: true })} className={`rounded-full border px-3.5 py-1.5 text-sm ${filters.status === v ? 'border-gold text-gold-hi' : 'border-line text-cream/80'}`}>
                        {l}
                    </button>
                ))}
            </div>
            <div className="overflow-x-auto rounded-2xl border border-line">
                <table className="w-full min-w-[900px] text-sm">
                    <thead className="bg-panel text-left text-xs text-mist">
                        <tr>
                            <th className="px-4 py-3 font-medium">Prize</th>
                            <th className="px-4 py-3 font-medium">Winner</th>
                            <th className="px-4 py-3 font-medium">Raffle</th>
                            <th className="px-4 py-3 font-medium">Won</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {wins.data.map((w) => (
                            <tr key={w.id} className="bg-panel/40 align-top">
                                <td className="px-4 py-3"><span className="font-semibold text-gold-hi">{w.title}</span><div className="num text-xs text-mist">{money(w.value_cents, cur)}, ticket #{w.ticket_number}</div></td>
                                <td className="px-4 py-3">{w.user}<div className="text-xs text-mist">{w.email}, {w.phone}</div><div className="text-xs text-mist">{w.address}</div></td>
                                <td className="px-4 py-3"><Link href={`/admin/raffles/${w.raffle_slug}`} className="hover:text-gold-hi">{w.raffle}</Link></td>
                                <td className="num px-4 py-3 text-cream/75">{dateTime(w.won_at)}</td>
                                <td className="px-4 py-3">
                                    <select className="field w-auto py-1.5 text-sm" value={w.status ?? 'pending'} onChange={(e) => set(w.id, e.target.value)} aria-label="Fulfilment status">
                                        <option value="pending">To pay out</option>
                                        <option value="paid">Paid</option>
                                        <option value="shipped">Shipped</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {wins.data.length === 0 && <p className="p-8 text-center text-mist">Nothing here.</p>}
            </div>
            <Pagination links={wins.links} />
        </AdminLayout>
    );
}
