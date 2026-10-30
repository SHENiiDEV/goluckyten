import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Media from './Media';
import { money, number } from '../lib/format';

let openDrawer = () => {};
/** Open the basket drawer from anywhere (header icon, after adding tickets). */
export function showBasket() {
    openDrawer();
}

export default function BasketDrawer() {
    const { basket, app, flash } = usePage().props;
    const [state, setState] = useState('closed');
    const [mounted, setMounted] = useState(false);
    const panel = useRef(null);
    const lines = basket.lines ?? [];
    const subtotal = lines.reduce((s, l) => s + l.total_cents, 0);

    const open = () => {
        setMounted(true);
        requestAnimationFrame(() => setState('open'));
    };
    const close = () => setState('closed');
    openDrawer = open;

    useEffect(() => {
        if (flash?.basket_opened) open();
    }, [flash?.basket_opened, basket.count]);

    useEffect(() => {
        if (state !== 'open') return;
        const onKey = (e) => e.key === 'Escape' && close();
        document.addEventListener('keydown', onKey);
        panel.current?.focus();
        const off = router.on('navigate', close);
        return () => {
            document.removeEventListener('keydown', onKey);
            off();
        };
    }, [state]);

    if (!mounted) return null;

    const setQty = (slug, quantity) => router.patch(`/basket/${slug}`, { quantity }, { preserveScroll: true, preserveState: true, only: ['basket'] });

    return (
        <div className="fixed inset-0 z-[60]" aria-hidden={state === 'closed'} inert={state === 'closed' ? '' : undefined}
            onTransitionEnd={(e) => e.target === panel.current && state === 'closed' && setMounted(false)}>
            <div data-state={state} className="drawer-scrim absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={close} />
            <aside
                ref={panel}
                tabIndex={-1}
                data-state={state}
                role="dialog"
                aria-modal="true"
                aria-label="Your basket"
                className="drawer-panel absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line bg-ink-2 shadow-2xl outline-none"
            >
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                    <div>
                        <h2 className="font-wide text-xl">Your basket</h2>
                        <p className="text-sm text-mist">{number(basket.count)} {basket.count === 1 ? 'ticket' : 'tickets'}</p>
                    </div>
                    <button onClick={close} className="pressable rounded-lg p-2 text-mist hover:text-white" aria-label="Close basket">
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                </div>

                {lines.length === 0 ? (
                    <div className="grid flex-1 place-items-center p-8 text-center">
                        <div>
                            <p className="font-wide text-lg">Nothing here yet</p>
                            <p className="mt-1 text-sm text-mist">Tickets start at 10c.</p>
                            <Link href="/raffles" className="btn btn-primary mt-5">See competitions</Link>
                        </div>
                    </div>
                ) : (
                    <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
                        {lines.map((l) => (
                            <li key={l.id} className="flex gap-4 py-4">
                                <Link href={`/raffles/${l.slug}`} className="h-16 w-20 shrink-0 overflow-hidden rounded-lg">
                                    <Media src={l.image_url} title={l.title} />
                                </Link>
                                <div className="min-w-0 flex-1">
                                    <Link href={`/raffles/${l.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-violet-hi">{l.title}</Link>
                                    <p className="mt-0.5 text-xs text-mist">
                                        {money(l.ticket_price_cents, app.currency)} each
                                        {l.numbers.length > 0 && <> · picked #{l.numbers.slice(0, 4).map(number).join(', #')}{l.numbers.length > 4 ? '…' : ''}</>}
                                    </p>
                                    <div className="mt-2 flex items-center gap-3">
                                        <div className="flex items-center rounded-full border border-line-2 text-sm">
                                            <button className="h-7 w-7 hover:text-violet-hi" onClick={() => setQty(l.slug, l.quantity - 1)} aria-label="One fewer">−</button>
                                            <span className="num w-10 text-center">{number(l.quantity)}</span>
                                            <button className="h-7 w-7 hover:text-violet-hi" onClick={() => setQty(l.slug, l.quantity + 1)} aria-label="One more">+</button>
                                        </div>
                                    </div>
                                </div>
                                <span className="num text-sm font-bold">{money(l.total_cents, app.currency)}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {lines.length > 0 && (
                    <div className="border-t border-line p-5">
                        <div className="flex items-baseline justify-between">
                            <span className="text-mist">Subtotal</span>
                            <span className="num font-wide text-2xl text-amber">{money(subtotal, app.currency)}</span>
                        </div>
                        <p className="mt-1 text-xs text-mist">Promo codes and wallet balance are applied at checkout.</p>
                        <Link href="/basket" className="btn btn-primary mt-4 w-full">Checkout</Link>
                        <button onClick={close} className="mt-2 w-full py-2 text-sm text-mist hover:text-white">Keep browsing</button>
                    </div>
                )}
            </aside>
        </div>
    );
}
