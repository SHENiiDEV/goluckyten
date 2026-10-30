import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import Pagination from '../../Components/Pagination';
import { dateTime, money } from '../../lib/format';

function Row({ w, cur }) {
    const [note, setNote] = useState('');
    const [rejecting, setRejecting] = useState(false);
    return (
        <tr className="bg-panel/40 align-top">
            <td className="px-4 py-3">{w.user.name}<div className="text-xs text-mist">{w.user.email}</div></td>
            <td className="num px-4 py-3 font-bold">{money(w.amount_cents, cur)}</td>
            <td className="px-4 py-3"><div>{w.account_name}</div><div className="font-mono text-xs text-mist">{w.iban}</div></td>
            <td className="px-4 py-3 text-xs text-mist">{dateTime(w.created_at)}</td>
            <td className="px-4 py-3">
                {w.status === 'pending' ? (
                    rejecting ? (
                        <div className="flex gap-2">
                            <input className="field h-9 text-sm" placeholder="Reason (shown to player)" value={note} onChange={(e) => setNote(e.target.value)} />
                            <button disabled={!note} onClick={() => router.post(`/admin/withdrawals/${w.id}/reject`, { note }, { preserveScroll: true })} className="btn btn-ghost btn-sm">Reject</button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => router.post(`/admin/withdrawals/${w.id}/paid`, {}, { preserveScroll: true })} className="btn btn-jade btn-sm">Mark paid</button>
                            <button onClick={() => setRejecting(true)} className="btn btn-ghost btn-sm">Reject…</button>
                        </div>
                    )
                ) : (
                    <span className="capitalize">{w.status}{w.admin_note && <span className="block text-xs text-mist">{w.admin_note}</span>}</span>
                )}
            </td>
        </tr>
    );
}

export default function Withdrawals({ withdrawals, status }) {
    const cur = usePage().props.app.currency;
    return (
        <AdminLayout title="Withdrawals">
            <div className="mb-5 flex gap-2">
                {['pending', 'paid', 'rejected', 'all'].map((s) => (
                    <Link key={s} href={`/admin/withdrawals?status=${s}`} className={`rounded-full px-4 py-1.5 text-sm capitalize ${status === s ? 'bg-violet text-white' : 'border border-line text-cream/80'}`}>{s}</Link>
                ))}
            </div>
            <p className="mb-4 text-sm text-mist">Pay by bank transfer to the account shown, in the player’s name only, then mark paid. Rejecting returns the money to their wallet.</p>
            <div className="overflow-x-auto rounded-2xl border border-line">
                <table className="w-full min-w-[820px] text-sm">
                    <thead className="bg-panel text-left text-xs text-mist">
                        <tr><th className="px-4 py-3">Player</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Bank</th><th className="px-4 py-3">Requested</th><th className="px-4 py-3">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {withdrawals.data.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-mist">Nothing here.</td></tr>}
                        {withdrawals.data.map((w) => <Row key={w.id} w={w} cur={cur} />)}
                    </tbody>
                </table>
            </div>
            <Pagination links={withdrawals.links} />
        </AdminLayout>
    );
}
