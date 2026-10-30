import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import Pagination from '../../Components/Pagination';
import { date, money, number } from '../../lib/format';

export default function Users({ users, filters }) {
    const cur = usePage().props.app.currency;
    const [q, setQ] = useState(filters.q ?? '');

    return (
        <AdminLayout title="Players">
            <form onSubmit={(e) => { e.preventDefault(); router.get('/admin/users', q ? { q } : {}, { preserveState: true }); }} className="mb-5 flex max-w-md gap-2">
                <input className="field" placeholder="Search name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search players" />
                <button className="btn btn-ghost btn-sm">Search</button>
            </form>
            <div className="overflow-x-auto rounded-2xl border border-line">
                <table className="w-full min-w-[860px] text-sm">
                    <thead className="bg-panel text-left text-xs text-mist">
                        <tr>
                            <th className="px-4 py-3 font-medium">Player</th>
                            <th className="px-4 py-3 font-medium">Phone</th>
                            <th className="px-4 py-3 font-medium">Location</th>
                            <th className="px-4 py-3 font-medium">Born</th>
                            <th className="px-4 py-3 font-medium">Tickets</th>
                            <th className="px-4 py-3 font-medium">Spent</th>
                            <th className="px-4 py-3 font-medium">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {users.data.map((u) => (
                            <tr key={u.id} className="bg-panel/40">
                                <td className="px-4 py-3">{u.name}{u.is_admin && <span className="ml-2 text-xs text-gold-hi">admin</span>}<div className="text-xs text-mist">{u.email}</div></td>
                                <td className="num px-4 py-3">{u.phone}</td>
                                <td className="px-4 py-3">{u.city}, {u.country}</td>
                                <td className="num px-4 py-3">{date(u.date_of_birth)}</td>
                                <td className="num px-4 py-3">{number(u.tickets_count)}</td>
                                <td className="num px-4 py-3">{money(u.spent_cents, cur)}</td>
                                <td className="num px-4 py-3 text-cream/75">{date(u.created_at)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.data.length === 0 && <p className="p-8 text-center text-mist">No players match “{filters.q}”.</p>}
            </div>
            <Pagination links={users.links} />
        </AdminLayout>
    );
}
