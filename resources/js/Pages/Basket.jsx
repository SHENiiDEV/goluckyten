import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import SiteLayout from '../Layouts/SiteLayout';
import Media from '../Components/Media';
import { Checkbox } from '../Components/Form';
import { dateTime, money, number } from '../lib/format';

function PromoBox({ promo, promoError }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ promo_code: '' });
    if (promo) {
        return (
            <div className="flex items-center justify-between rounded-xl border border-jade/30 bg-jade/10 px-3.5 py-2.5 text-sm">
                <span><span className="font-mono font-bold text-jade">{promo.code}</span> <span className="text-cream/80">{promo.label}</span></span>
                <button type="button" onClick={() => router.delete('/basket/promo', { preserveScroll: true })} className="text-xs text-mist hover:text-white">Remove</button>
            </div>
        );
    }
    return (
        <div>
            {!open && !promoError ? (
                <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold text-violet-hi hover:text-white">Have a promo code?</button>
            ) : (
                <div className="flex gap-2">
                    <input className="field h-11 flex-1 font-mono uppercase" placeholder="CODE" aria-label="Promo code" value={form.data.promo_code}
                        onChange={(e) => form.setData('promo_code', e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); form.post('/basket/promo', { preserveScroll: true }); } }} />
                    <button type="button" disabled={!form.data.promo_code || form.processing} onClick={() => form.post('/basket/promo', { preserveScroll: true })} className="btn btn-ghost btn-sm h-11">Apply</button>
                </div>
            )}
            {(form.errors.promo_code || promoError) && <p className="mt-1.5 text-xs text-ruby" role="alert">{form.errors.promo_code || promoError}</p>}
        </div>
    );
}

export default function Basket({ lines, subtotal_cents, promo, promoError, wallet_cents, limit }) {
    const { app, auth, errors: pageErrors } = usePage().props;
    const cur = app.currency;
    const form = useForm({ confirm_terms: false, use_wallet: wallet_cents > 0 });

    const setQty = (slug, quantity) => router.patch(`/basket/${slug}`, { quantity }, { preserveScroll: true });
    const remove = (slug) => router.delete(`/basket/${slug}`, { preserveScroll: true });

    const count = lines.reduce((s, l) => s + l.quantity, 0);
    const discount = promo?.discount_cents ?? 0;
    const total = subtotal_cents - discount;
    const walletUse = form.data.use_wallet ? Math.min(wallet_cents, total) : 0;
    const toPay = total - walletUse;
    const overLimit = limit?.remaining_cents != null && total > limit.remaining_cents;
    const excluded = !!limit?.excluded_until;
    const basketError = form.errors.basket || form.errors.quantity || form.errors.wallet || form.errors.promo_code || pageErrors.quantity || pageErrors.numbers;

    return (
        <SiteLayout newsletter={false}>
            <Head title="Your basket" />
            <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
                <h1 className="font-display text-5xl">Your basket</h1>

                {lines.length === 0 ? (
                    <div className="card mt-10 p-12 text-center">
                        <p className="font-display text-2xl">Your basket is empty</p>
                        <p className="mt-2 text-mist">Pick a competition and add some tickets to get started.</p>
                        <Link href="/raffles" className="btn btn-gold mt-6">Browse competitions</Link>
                    </div>
                ) : (
                    <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
                        <ul className="space-y-4">
                            {lines.map(({ raffle, quantity, numbers, total_cents }) => {
                                const max = Math.min(raffle.max_per_user, raffle.tickets_remaining);
                                return (
                                    <li key={raffle.id} className="card flex flex-col gap-5 p-4 sm:flex-row sm:items-center">
                                        <Link href={`/raffles/${raffle.slug}`} className="block aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl sm:w-40">
                                            <Media src={raffle.image_url} category={raffle.category} title={raffle.title} />
                                        </Link>
                                        <div className="min-w-0 flex-1">
                                            <Link href={`/raffles/${raffle.slug}`} className="font-display text-xl hover:text-gold-hi">{raffle.title}</Link>
                                            <p className="mt-1 text-sm text-mist">
                                                Draw {dateTime(raffle.draws_at)}, {money(raffle.ticket_price_cents, cur)} per ticket
                                                {raffle.regular_price_cents && <span className="ml-1.5 text-mist/70 line-through">{money(raffle.regular_price_cents, cur)}</span>}
                                            </p>
                                            {numbers.length > 0 && (
                                                <p className="mt-2 text-xs text-cream/80">
                                                    Your picks: <span className="num text-violet-hi">#{numbers.slice(0, 12).map(number).join(', #')}{numbers.length > 12 ? ` +${numbers.length - 12}` : ''}</span>
                                                    {quantity > numbers.length && <span className="text-mist"> + {number(quantity - numbers.length)} lucky dip</span>}
                                                </p>
                                            )}
                                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                                <div className="flex items-center rounded-full border border-line-2">
                                                    <button className="h-9 w-9 text-lg hover:text-gold-hi" onClick={() => setQty(raffle.slug, quantity - 1)} aria-label="One fewer">−</button>
                                                    <span className="num w-14 text-center">{number(quantity)}</span>
                                                    <button className="h-9 w-9 text-lg hover:text-gold-hi disabled:opacity-40" disabled={quantity >= max} onClick={() => setQty(raffle.slug, quantity + 1)} aria-label="One more">+</button>
                                                </div>
                                                <button onClick={() => remove(raffle.slug)} className="text-sm text-mist underline-offset-4 hover:text-cream hover:underline">Remove</button>
                                            </div>
                                        </div>
                                        <div className="num text-right font-display text-2xl sm:w-32">{money(total_cents, cur)}</div>
                                    </li>
                                );
                            })}
                        </ul>

                        <form onSubmit={(e) => { e.preventDefault(); form.post('/checkout', { preserveScroll: true }); }} className="ticket h-fit p-6 lg:sticky lg:top-28" style={{ '--stub-at': '70%' }}>
                            <h2 className="font-display text-2xl">Summary</h2>
                            <dl className="mt-5 space-y-3 text-sm">
                                <div className="flex justify-between"><dt className="text-mist">{number(count)} tickets, {lines.length} {lines.length === 1 ? 'competition' : 'competitions'}</dt><dd className="num">{money(subtotal_cents, cur)}</dd></div>
                                {discount > 0 && <div className="flex justify-between text-jade"><dt>Promo {promo.code}</dt><dd className="num">−{money(discount, cur)}</dd></div>}
                                {walletUse > 0 && <div className="flex justify-between text-amber"><dt>From wallet</dt><dd className="num">−{money(walletUse, cur)}</dd></div>}
                            </dl>
                            <div className="mt-4"><PromoBox promo={promo} promoError={promoError} /></div>
                            <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
                                <span className="text-mist">To pay</span>
                                <span key={toPay} className="swap-in num font-display text-4xl text-gold-hi">{money(toPay, cur)}</span>
                            </div>
                            <div className="perforation -mx-6 my-6" />
                            {auth.user ? (
                                <>
                                    {wallet_cents > 0 && (
                                        <Checkbox className="mb-4" checked={form.data.use_wallet} onChange={(e) => form.setData('use_wallet', e.target.checked)}>
                                            Use my wallet balance ({money(wallet_cents, cur)})
                                        </Checkbox>
                                    )}
                                    <Checkbox checked={form.data.confirm_terms} onChange={(e) => form.setData('confirm_terms', e.target.checked)} error={form.errors.confirm_terms}>
                                        I’m 18 or over and I’ve read the <Link href="/terms" className="text-gold-hi underline">Terms &amp; Conditions</Link>.
                                    </Checkbox>
                                    {excluded && <p className="mt-4 rounded-lg bg-amber/10 p-3 text-sm text-amber">You’re on a break, so you can’t pay for entries right now.</p>}
                                    {!excluded && overLimit && (
                                        <p className="mt-4 rounded-lg bg-amber/10 p-3 text-sm text-amber">
                                            This is over your spend limit. You have {money(limit.remaining_cents, cur)} left. <Link href="/account/safer-play" className="underline">Limits</Link>
                                        </p>
                                    )}
                                    {basketError && <p className="mt-4 text-sm text-ruby" role="alert">{basketError}</p>}
                                    <button type="submit" disabled={form.processing || excluded || overLimit} className="btn btn-gold mt-6 w-full">
                                        {form.processing ? 'Processing…' : toPay === 0 ? 'Confirm entry' : `Pay ${money(toPay, cur)}`}
                                    </button>
                                    <p className="mt-3 text-center text-xs text-mist">Test mode: card payment is simulated and always succeeds.</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-cream/80">Sign in or create an account to pay. Your basket is kept.</p>
                                    <div className="mt-5 grid gap-2.5">
                                        <Link href="/login" className="btn btn-gold">Sign in to pay</Link>
                                        <Link href="/register" className="btn btn-ghost">Create account</Link>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>
                )}
            </section>
        </SiteLayout>
    );
}
