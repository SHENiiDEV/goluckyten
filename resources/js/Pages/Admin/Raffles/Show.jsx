import { Link, router, useForm, usePage } from '@inertiajs/react';
import { Input, Select } from '../../../Components/Form';
import { useState } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import StatusBadge from '../../../Components/StatusBadge';
import Pagination from '../../../Components/Pagination';
import Progress from '../../../Components/Progress';
import { dateTime, money, number } from '../../../lib/format';

function WinnerStory({ raffle }) {
    const form = useForm({ winner_story: raffle.winner_story ?? '', winner_photo: null });
    return (
        <form onSubmit={(e) => { e.preventDefault(); form.post(`/admin/raffles/${raffle.slug}/winner`, { preserveScroll: true, forceFormData: true }); }} className="card mt-6 space-y-4 p-5">
            <p className="font-bold">Winner story for the winners page</p>
            <textarea className="field min-h-24" placeholder="Anna from Riga picked 25 tickets on her lunch break…" value={form.data.winner_story} onChange={(e) => form.setData('winner_story', e.target.value)} />
            <div className="flex flex-wrap items-center gap-4">
                {raffle.winner_photo_url && <img src={raffle.winner_photo_url} alt="" className="h-16 w-16 rounded-lg object-cover" />}
                <input type="file" accept="image/*" onChange={(e) => form.setData('winner_photo', e.target.files[0] ?? null)} className="text-sm text-mist file:mr-3 file:rounded-lg file:border-0 file:bg-panel-2 file:px-4 file:py-2 file:text-cream" />
                <button disabled={form.processing} className="btn btn-primary btn-sm ml-auto">Save story</button>
            </div>
            <p className="text-xs text-mist">Only publish a photo and story with the winner’s written permission.</p>
        </form>
    );
}

function InstantManager({ raffle, prizes, cur }) {
    const form = useForm({ title: '', prize_type: 'cash', value: '', quantity: 1, image: null });
    const [open, setOpen] = useState(null);
    const locked = raffle.status === 'drawn';

    return (
        <div className="mt-10">
            <h2 className="font-display text-2xl">Instant wins</h2>
            <p className="mt-1 text-sm text-mist">Each prize is hidden behind a random ticket number that hasn’t been issued yet. Players never see the numbers.</p>
            {prizes.length > 0 && (
                <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line">
                    {prizes.map((p) => (
                        <li key={p.title + p.value_cents} className="bg-panel/40 px-4 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                                <span><span className="font-semibold">{p.title}</span> <span className="text-mist">({p.type}, {money(p.value_cents, cur)} each)</span></span>
                                <span className="flex items-center gap-4">
                                    <span className="num">{p.claimed} / {p.total} won</span>
                                    <button onClick={() => setOpen(open === p.title ? null : p.title)} className="text-gold-hi hover:underline">{open === p.title ? 'Hide numbers' : 'Numbers'}</button>
                                    {!locked && p.claimed < p.total && (
                                        <button
                                            onClick={() => router.delete(`/admin/raffles/${raffle.slug}/instant-wins`, { data: { title: p.title, value_cents: p.value_cents }, preserveScroll: true })}
                                            className="text-mist hover:text-ruby"
                                        >
                                            Remove unclaimed
                                        </button>
                                    )}
                                </span>
                            </div>
                            {open === p.title && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {p.numbers.map((n) => (
                                        <span key={n.n} title={n.won_by ?? 'Not won yet'} className={`num rounded-md border px-2 py-0.5 text-xs ${n.won_by ? 'border-gold bg-gold text-ink' : 'border-line-2 text-cream/80'}`}>{n.n}</span>
                                    ))}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            {!locked && (
                <form onSubmit={(e) => { e.preventDefault(); form.post(`/admin/raffles/${raffle.slug}/instant-wins`, { preserveScroll: true, forceFormData: true, onSuccess: () => form.reset() }); }} className="card mt-4 grid gap-4 p-5 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-end">
                    <Input label="Prize" placeholder="€100 cash" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} error={form.errors.title} />
                    <Select label="Type" value={form.data.prize_type} onChange={(e) => form.setData('prize_type', e.target.value)}>
                        <option value="cash">Cash</option>
                        <option value="item">Item</option>
                    </Select>
                    <Input label="Value (€)" type="number" step="0.01" value={form.data.value} onChange={(e) => form.setData('value', e.target.value)} error={form.errors.value} />
                    <Input label="How many" type="number" min="1" value={form.data.quantity} onChange={(e) => form.setData('quantity', e.target.value)} error={form.errors.quantity} />
                    <button type="submit" disabled={form.processing} className="btn btn-gold">Add</button>
                </form>
            )}
        </div>
    );
}

export default function Show({ raffle, tickets, instantPrizes }) {
    const { app, errors } = usePage().props;
    const cur = app.currency;
    const [confirming, setConfirming] = useState(false);
    const [drawing, setDrawing] = useState(false);
    const canDraw = raffle.status !== 'drawn' && raffle.status !== 'draft' && raffle.tickets_sold > 0;
    const early = raffle.status === 'live' && new Date(raffle.draws_at) > new Date();

    const draw = () => {
        setDrawing(true);
        router.post(`/admin/raffles/${raffle.slug}/draw`, {}, { preserveScroll: true, onFinish: () => { setDrawing(false); setConfirming(false); } });
    };

    return (
        <AdminLayout
            title={raffle.title}
            actions={
                <div className="flex gap-2">
                    <Link href={`/raffles/${raffle.slug}`} className="btn btn-ghost btn-sm">View on site</Link>
                    <Link href={`/admin/raffles/${raffle.slug}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                </div>
            }
        >
            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                <div className="card p-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge status={raffle.status} />
                        <span className="text-sm text-mist">Draw {dateTime(raffle.draws_at)}</span>
                    </div>
                    <div className="mt-6"><Progress sold={raffle.tickets_sold} max={raffle.max_tickets} /></div>
                    <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {[
                            ['Paid tickets', number(raffle.paid_tickets)],
                            ['Free tickets', number(raffle.free_tickets)],
                            ['Players', number(raffle.players)],
                            ['Ticket revenue', money(raffle.revenue_cents, cur)],
                        ].map(([k, v]) => (
                            <div key={k}><dt className="text-xs text-mist">{k}</dt><dd className="num mt-1 font-display text-xl">{v}</dd></div>
                        ))}
                    </dl>
                </div>

                <div className="ticket p-6" style={{ '--stub-at': '50%' }}>
                    {raffle.winner ? (
                        <>
                            <p className="text-sm text-mist">Winning ticket</p>
                            <p className="num font-display text-5xl text-gold-hi">#{raffle.winner.number}</p>
                            <p className="mt-1 text-xs text-mist">{raffle.winner.entry_type === 'free' ? 'Free entry' : 'Paid entry'}, drawn {dateTime(raffle.drawn_at)}</p>
                            <div className="perforation -mx-6 my-5" />
                            <p className="font-semibold">{raffle.winner.name}</p>
                            <p className="text-sm text-cream/80">{raffle.winner.email}</p>
                            <p className="text-sm text-cream/80">{raffle.winner.phone}</p>
                            <p className="mt-2 text-sm text-mist">{raffle.winner.address}</p>
                        </>
                    ) : (
                        <>
                            <p className="font-display text-2xl">Run the draw</p>
                            <p className="mt-2 text-sm text-mist">One ticket is picked at random from all {number(raffle.tickets_sold)} tickets. This can’t be undone.</p>
                            {errors.draw && <p className="mt-3 text-sm text-ruby">{errors.draw}</p>}
                            {!confirming ? (
                                <button disabled={!canDraw} onClick={() => setConfirming(true)} className="btn btn-gold mt-5 w-full">Draw winner</button>
                            ) : (
                                <div className="mt-5 space-y-2">
                                    {early && <p className="text-xs text-gold-hi">The draw time hasn’t been reached yet. Entries will close now.</p>}
                                    <button onClick={draw} disabled={drawing} className="btn btn-gold w-full">{drawing ? 'Drawing…' : 'Confirm and draw'}</button>
                                    <button onClick={() => setConfirming(false)} className="btn btn-ghost w-full">Cancel</button>
                                </div>
                            )}
                            {!canDraw && raffle.status === 'draft' && <p className="mt-3 text-xs text-mist">Publish the raffle first.</p>}
                        </>
                    )}
                </div>
            </div>

            {raffle.winner && <WinnerStory raffle={raffle} />}
            <InstantManager raffle={raffle} prizes={instantPrizes} cur={cur} />

            <h2 className="mt-10 font-display text-2xl">Tickets</h2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
                <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-panel text-left text-xs text-mist">
                        <tr><th className="px-4 py-3 font-medium">Number</th><th className="px-4 py-3 font-medium">Player</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Issued</th></tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {tickets.data.map((t) => (
                            <tr key={t.number} className={`bg-panel/40 ${raffle.winner?.number === t.number ? 'bg-gold/10' : ''}`}>
                                <td className="num px-4 py-2.5 font-semibold text-gold-hi">#{t.number}</td>
                                <td className="px-4 py-2.5">{t.user}<div className="text-xs text-mist">{t.email}</div></td>
                                <td className="px-4 py-2.5"><StatusBadge status={t.entry_type === 'free' ? 'free' : 'paid'} /></td>
                                <td className="num px-4 py-2.5 text-cream/75">{dateTime(t.created_at)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {tickets.data.length === 0 && <p className="p-8 text-center text-mist">No tickets yet.</p>}
            </div>
            <Pagination links={tickets.links} />
        </AdminLayout>
    );
}
