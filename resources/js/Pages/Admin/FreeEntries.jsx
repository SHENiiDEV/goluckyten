import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import StatusBadge from '../../Components/StatusBadge';
import Pagination from '../../Components/Pagination';
import { dateTime } from '../../lib/format';

const tabs = [
    ['open', 'To do'],
    ['awaiting_letter', 'Waiting for letter'],
    ['pending', 'Letter received'],
    ['approved', 'Approved'],
    ['rejected', 'Rejected'],
    ['all', 'All'],
];

function RequestRow({ r }) {
    const [mode, setMode] = useState(null); // null | 'reject' | 'received'
    const reject = useForm({ admin_note: '' });
    const received = useForm({ statement: r.statement ?? '' });
    const { errors } = usePage().props;
    const open = r.status === 'awaiting_letter' || r.status === 'pending';
    const closed = r.raffle_status !== 'live';

    return (
        <li className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="num font-wide text-lg tracking-wider text-white">{r.reference}</span>
                        <StatusBadge status={r.status} />
                        {r.ticket_number && <span className="num text-sm text-gold-hi">Ticket #{r.ticket_number}</span>}
                    </div>
                    <p className="mt-2 font-display text-xl">{r.full_name}</p>
                    <p className="text-sm text-cream/80">Account email: <span className="text-white">{r.email}</span></p>
                    <p className="text-sm text-mist">{r.address}</p>
                </div>
                <div className="text-right text-sm">
                    <Link href={`/admin/raffles/${r.raffle_slug}`} className="text-gold-hi hover:underline">{r.raffle}</Link>
                    <div className="text-xs text-mist">Code issued {dateTime(r.created_at)}</div>
                    {r.letter_received_at && <div className="text-xs text-mist">Letter received {dateTime(r.letter_received_at)}</div>}
                </div>
            </div>

            {r.statement && <blockquote className="mt-4 rounded-xl border-l-2 border-gold-deep bg-ink-2/60 px-4 py-3 text-sm italic text-cream/85">{r.statement}</blockquote>}
            {r.admin_note && <p className="mt-3 text-sm text-mist">Note: {r.admin_note}</p>}

            {open && (
                <div className="mt-4">
                    {errors.request && <p className="mb-3 text-sm text-ruby">{errors.request}</p>}
                    {r.status === 'awaiting_letter' && !mode && (
                        <p className="mb-3 text-xs text-mist">Approve only after a posted letter with this code arrives. Check the name and address match the account above, it names the competition, has a request in the player’s own words and is signed.</p>
                    )}

                    {mode === 'reject' ? (
                        <form onSubmit={(e) => { e.preventDefault(); reject.post(`/admin/free-entries/${r.id}/reject`, { preserveScroll: true }); }} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                            <div className="flex-1">
                                <input className="field" placeholder="Reason, sent to the player" value={reject.data.admin_note} onChange={(e) => reject.setData('admin_note', e.target.value)} autoFocus />
                                {reject.errors.admin_note && <p className="mt-1 text-xs text-ruby">{reject.errors.admin_note}</p>}
                            </div>
                            <button type="submit" disabled={reject.processing} className="btn btn-ghost btn-sm">Reject request</button>
                            <button type="button" onClick={() => setMode(null)} className="btn btn-sm text-mist">Cancel</button>
                        </form>
                    ) : mode === 'received' ? (
                        <form className="space-y-2">
                            <label className="block text-xs text-mist">Player’s request from the letter (optional, kept on file)</label>
                            <textarea rows={3} className="field py-2" value={received.data.statement} onChange={(e) => received.setData('statement', e.target.value)} autoFocus />
                            <div className="flex flex-wrap gap-2">
                                {r.status === 'awaiting_letter' && (
                                    <button type="button" disabled={received.processing} onClick={() => received.post(`/admin/free-entries/${r.id}/received`, { preserveScroll: true, onSuccess: () => setMode(null) })} className="btn btn-ghost btn-sm">
                                        Mark letter received
                                    </button>
                                )}
                                <button type="button" disabled={received.processing || closed} onClick={() => received.post(`/admin/free-entries/${r.id}/approve`, { preserveScroll: true })} className="btn btn-gold btn-sm">
                                    Approve and issue ticket
                                </button>
                                <button type="button" onClick={() => setMode(null)} className="btn btn-sm text-mist">Cancel</button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setMode('received')} className="btn btn-gold btn-sm" disabled={closed}>
                                {r.status === 'awaiting_letter' ? 'Letter arrived…' : 'Approve…'}
                            </button>
                            <button onClick={() => setMode('reject')} className="btn btn-ghost btn-sm">Reject</button>
                            {closed && <span className="self-center text-xs text-mist">Competition is {r.raffle_status}; it can only be rejected.</span>}
                        </div>
                    )}
                </div>
            )}
        </li>
    );
}

export default function FreeEntries({ requests, filters, counts, postTo }) {
    const [code, setCode] = useState(filters.code ?? '');
    const total = (k) => (k === 'open' ? (counts.awaiting_letter ?? 0) + (counts.pending ?? 0) : counts[k]);

    return (
        <AdminLayout title="Free entries">
            <div className="card mb-6 p-5">
                <p className="text-sm text-cream/85">
                    Players get a code on the site and post a letter with it to <span className="font-semibold text-white">{postTo}</span>. For each letter, search its code, check the name and address match the account, that it has a request in the player’s own words and is signed, then approve. Keep the letters on file.
                </p>
                <form onSubmit={(e) => { e.preventDefault(); router.get('/admin/free-entries', { code }, { preserveState: true }); }} className="mt-4 flex gap-2">
                    <input className="field h-11 flex-1 font-mono uppercase" placeholder="FE-XXXX-XXXX" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Search by entry code" />
                    <button className="btn btn-primary btn-sm h-11">Find</button>
                    {filters.code && <button type="button" onClick={() => { setCode(''); router.get('/admin/free-entries'); }} className="btn btn-ghost btn-sm h-11">Clear</button>}
                </form>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
                {tabs.map(([v, l]) => (
                    <button key={v} onClick={() => router.get('/admin/free-entries', { status: v }, { preserveState: true })} className={`rounded-full border px-3.5 py-1.5 text-sm ${!filters.code && filters.status === v ? 'border-gold text-gold-hi' : 'border-line text-cream/80'}`}>
                        {l}{v !== 'all' && total(v) ? <span className="num ml-1.5 text-mist">{total(v)}</span> : null}
                    </button>
                ))}
            </div>
            {requests.data.length ? (
                <ul className="space-y-4">{requests.data.map((r) => <RequestRow key={r.id} r={r} />)}</ul>
            ) : (
                <div className="card p-10 text-center text-mist">{filters.code ? `No request with code ${filters.code}.` : 'Nothing here.'}</div>
            )}
            <Pagination links={requests.links} />
        </AdminLayout>
    );
}
