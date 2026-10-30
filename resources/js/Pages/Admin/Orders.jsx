import { usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import Pagination from '../../Components/Pagination';
import StatusBadge from '../../Components/StatusBadge';
import { dateTime, money } from '../../lib/format';

export default function Orders({ orders }) {
    const cur = usePage().props.app.currency;
    return (
        <AdminLayout title="Orders">
            <div className="overflow-x-auto rounded-2xl border border-line">
                <table className="w-full min-w-[820px] text-sm">
                    <thead className="bg-panel text-left text-xs text-mist">
                        <tr>
                            <th className="px-4 py-3 font-medium">Order</th>
                            <th className="px-4 py-3 font-medium">Player</th>
                            <th className="px-4 py-3 font-medium">Items</th>
                            <th className="px-4 py-3 font-medium">Total</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {orders.data.map((o) => (
                            <tr key={o.reference} className="bg-panel/40">
                                <td className="px-4 py-3"><span className="num">{o.reference}</span><div className="text-xs text-mist">{dateTime(o.created_at)}, {o.payment_method}</div></td>
                                <td className="px-4 py-3">{o.user}<div className="text-xs text-mist">{o.email}</div></td>
                                <td className="px-4 py-3 text-cream/80">{o.items.map((i) => <div key={i}>{i}</div>)}</td>
                                <td className="num px-4 py-3">{money(o.total_cents, cur)}</td>
                                <td className="px-4 py-3"><StatusBadge status={o.status} />{o.status === 'paid' && <a href={`/account/orders/${o.reference}/invoice`} className="ml-3 text-xs text-violet-hi hover:text-white">Invoice</a>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination links={orders.links} />
        </AdminLayout>
    );
}
