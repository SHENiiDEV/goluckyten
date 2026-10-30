import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import StatusBadge from '../../Components/StatusBadge';
import Pagination from '../../Components/Pagination';
import { dateTime } from '../../lib/format';

const tabs = [['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['all', 'All']];

function RequestRow({ r }) {
    const [rejecting, setRejecting] = useState(false);
    const reject = useForm({ admin_note: '' });
    const { errors } = usePage().props;

    return (
        <li className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="num text-sm text-mist">{r.reference}</span>
                        <StatusBadge status={r.status} />
                        {r.ticket_number && <span className="num text-sm text-gold-hi">Ticket #{r.ticket_number}</span>}
                    </div>
                    <p className="mt-2 font-display text-xl">{r.full_name}</p>
                    <p className="text-sm text-cream/80">{r.email} <span className="text-mist">({r.account})</span></p>
                    <p className="text-sm text-mist">{r.address}</p>
                </div>
                <div className="text-right text-sm">
                    <Link href={`/admin/raffles/${r.raffle_slug}`} className="text-gold-hi hover:underline">{r.raffle}</Link>
                    <div className="text-xs text-mist">Received {dateTime(r.created_at)}</div>
                </div>
            </div>
            <blockquote className="mt-4 rounded-xl border-l-2 border-gold-deep bg-ink-2/60 px-4 py-3 text-sm italic text-cream/85">{r.statement}</blockquote>
            {r.admin_note && <p className="mt-3 text-sm text-mist">Note: {r.admin_note}</p>}

            {r.status === 'pending' && (
                <div className="mt-4">
                    {errors.request && <p className="mb-3 text-sm text-ruby">{errors.request}</p>}
                    {!rejecting ? (
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => router.post(`/admin/free-entries/${r.id}/approve`, {}, { preserveScroll: true })} className="btn btn-gold btn-sm" disabled={r.raffle_status !== 'live'}>
                                Approve and issue ticket
                            </button>
                            <button onClick={() => setRejecting(true)} className="btn btn-ghost btn-sm">Reject</button>
                            {r.raffle_status !== 'live' && <span className="self-center text-xs text-mist">Raffle is {r.raffle_status}; it can only be rejected.</span>}
                        </div>
                    ) : (
                        <form onSubmit={(e) => { e.preventDefault(); reject.post(`/admin/free-entries/${r.id}/reject`, { preserveScroll: true }); }} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                            <div className="flex-1">
                                <input className="field" placeholder="Reason, sent to the player" value={reject.data.admin_note} onChange={(e) => reject.setData('admin_note', e.target.value)} autoFocus />
                                {reject.errors.admin_note && <p className="mt-1 text-xs text-ruby">{reject.errors.admin_note}</p>}
                            </div>
                            <button type="submit" disabled={reject.processing} className="btn btn-ghost btn-sm">Reject request</button>
                            <button type="button" onClick={() => setRejecting(false)} className="btn btn-sm text-mist">Cancel</button>
                        </form>
                    )}
                </div>
            )}
        </li>
    );
}

export default function FreeEntries({ requests, filters, counts }) {
    return (
        <AdminLayout title="Free entries">
            <div className="mb-6 flex flex-wrap gap-2">
                {tabs.map(([v, l]) => (
                    <button key={v} onClick={() => router.get('/admin/free-entries', { status: v }, { preserveState: true })} className={`rounded-full border px-3.5 py-1.5 text-sm ${filters.status === v ? 'border-gold text-gold-hi' : 'border-line text-cream/80'}`}>
                        {l}{v !== 'all' && counts[v] ? <span className="num ml-1.5 text-mist">{counts[v]}</span> : null}
                    </button>
                ))}
            </div>
            {requests.data.length ? (
                <ul className="space-y-4">{requests.data.map((r) => <RequestRow key={r.id} r={r} />)}</ul>
            ) : (
                <div className="card p-10 text-center text-mist">No {filters.status !== 'all' ? filters.status : ''} requests.</div>
            )}
            <Pagination links={requests.links} />
        </AdminLayout>
    );
}
