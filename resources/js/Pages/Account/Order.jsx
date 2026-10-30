import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import SiteLayout from '../../Layouts/SiteLayout';
import StatusBadge from '../../Components/StatusBadge';
import { dateTime, money } from '../../lib/format';

function Reveal({ wins, cur, checked }) {
    if (wins.length === 0) {
        return (
            <div className="mt-8 rounded-2xl border border-line bg-panel/60 p-5 text-sm text-cream/80">
                We checked your {checked} {checked === 1 ? 'ticket' : 'tickets'} for instant wins: no instant prize this time. Every ticket is still in the main draw.
            </div>
        );
    }
    const total = wins.filter((w) => w.type === 'cash').reduce((s, w) => s + w.value_cents, 0);
    return (
        <div className="mt-8 overflow-hidden rounded-[24px] border border-gold bg-gradient-to-br from-gold/20 via-panel to-panel p-6 sm:p-8">
            <p className="reveal-pop text-sm font-semibold text-gold-hi">Instant win</p>
            <h2 className="reveal-pop mt-1 font-display text-4xl sm:text-5xl" style={{ animationDelay: '120ms' }}>
                {wins.length === 1 ? `You won ${wins[0].title}` : `You won ${wins.length} instant prizes`}
            </h2>
            {total > 0 && wins.length > 1 && <p className="reveal-pop mt-2 text-cream/80" style={{ animationDelay: '220ms' }}>Including {money(total, cur)} in cash.</p>}
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {wins.map((w, i) => (
                    <li key={w.ticket_number} className="reveal-card flex items-center gap-4 rounded-2xl border border-gold-deep/60 bg-ink/60 p-4" style={{ animationDelay: `${350 + i * 140}ms` }}>
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold font-display text-xl text-ink">{w.type === 'cash' ? '€' : '✦'}</span>
                        <div>
                            <p className="font-semibold">{w.title}</p>
                            <p className="num text-xs text-mist">Ticket #{w.ticket_number}, {w.raffle}</p>
                        </div>
                    </li>
                ))}
            </ul>
            <p className="mt-5 text-sm text-mist">Cash prizes are already in your <Link href="/account/wallet" className="text-violet-hi underline">wallet</Link>. For items we’ll email you within 24 hours to arrange delivery.</p>
        </div>
    );
}

function NumberList({ numbers, winning }) {
    const [all, setAll] = useState(false);
    const LIMIT = 120;
    // Winning numbers first, so they're never hidden behind "show more".
    const sorted = [...winning, ...numbers.filter((n) => !winning.includes(n))];
    const shown = all ? sorted : sorted.slice(0, LIMIT);
    return (
        <>
            <div className="mt-2 flex flex-wrap gap-1.5">
                {shown.map((n) => (
                    <span key={n} className={`num rounded-md border px-2 py-1 text-sm ${winning.includes(n) ? 'border-gold bg-gold font-bold text-ink' : 'border-gold-deep/50 text-gold-hi'}`}>{n.toLocaleString('en-GB')}</span>
                ))}
            </div>
            {sorted.length > LIMIT && (
                <button onClick={() => setAll(!all)} className="mt-3 text-sm font-semibold text-violet-hi underline underline-offset-4">
                    {all ? 'Show fewer' : `Show all ${sorted.length.toLocaleString('en-GB')} numbers`}
                </button>
            )}
        </>
    );
}

export default function Order({ order, instantWins }) {
    const { app } = usePage().props;
    const cur = app.currency;

    return (
        <SiteLayout>
            <Head title={`Order ${order.reference}`} />
            <section className="mx-auto max-w-3xl px-4 pt-12 sm:px-6">
                <Link href="/account" className="text-sm text-mist hover:text-cream">My tickets</Link>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                    <h1 className="font-display text-4xl">Order {order.reference}</h1>
                    <StatusBadge status={order.status} />
                </div>
                <p className="mt-2 text-sm text-mist">Placed {dateTime(order.created_at)}</p>

                <Reveal wins={instantWins} cur={cur} checked={order.items.reduce((s, i) => s + i.numbers.length, 0)} />

                <div className="mt-8 space-y-4">
                    {order.items.map((i) => (
                        <div key={i.slug} className="ticket p-6" style={{ '--stub-at': '50%' }}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <Link href={`/raffles/${i.slug}`} className="font-display text-2xl hover:text-gold-hi">{i.title}</Link>
                                    <p className="mt-1 text-sm text-mist">Draw {dateTime(i.draws_at)}</p>
                                </div>
                                <div className="text-right">
                                    <div className="num font-display text-2xl">{money(i.total_cents, cur)}</div>
                                    <div className="num text-xs text-mist">{i.quantity} × {money(i.unit_price_cents, cur)}</div>
                                </div>
                            </div>
                            <div className="perforation -mx-6 my-5" />
                            <p className="text-xs text-mist">Your ticket numbers</p>
                            <NumberList numbers={i.numbers} winning={i.winning_numbers} />
                        </div>
                    ))}
                </div>

                <dl className="mt-6 space-y-2 rounded-2xl border border-line px-6 py-5 text-sm">
                    {order.discount_cents > 0 && (
                        <>
                            <div className="flex justify-between"><dt className="text-mist">Subtotal</dt><dd className="num">{money(order.subtotal_cents, cur)}</dd></div>
                            <div className="flex justify-between text-jade"><dt>Promo discount</dt><dd className="num">−{money(order.discount_cents, cur)}</dd></div>
                        </>
                    )}
                    {order.wallet_cents > 0 && <div className="flex justify-between"><dt className="text-mist">Paid from wallet</dt><dd className="num">{money(order.wallet_cents, cur)}</dd></div>}
                    <div className="flex items-baseline justify-between pt-1">
                        <dt className="text-base text-mist">Total</dt>
                        <dd className="num font-display text-3xl text-gold-hi">{money(order.total_cents, cur)}</dd>
                    </div>
                </dl>
                <div className="mt-8 flex flex-wrap gap-3">
                    {order.can_repeat && (
                        <button onClick={() => router.post(`/account/orders/${order.reference}/repeat`)} className="btn btn-gold">↻ Buy the same again</button>
                    )}
                    {order.status === 'paid' && (
                        <a href={`/account/orders/${order.reference}/invoice`} className="btn btn-ghost">Download invoice{order.invoice_number ? ` ${order.invoice_number}` : ''}</a>
                    )}
                    <Link href="/raffles" className="btn btn-ghost">Enter another competition</Link>
                    <Link href="/account" className="btn btn-ghost">View all my tickets</Link>
                </div>
            </section>
        </SiteLayout>
    );
}
