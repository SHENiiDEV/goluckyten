import { Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Logo from '../Components/Logo';
import Flash from '../Components/Flash';
import Ticker from '../Components/Ticker';
import BasketDrawer, { showBasket } from '../Components/BasketDrawer';
import NotificationBell from '../Components/NotificationBell';
import CookieBanner, { openCookieSettings } from '../Components/CookieBanner';
import SessionReminder from '../Components/SessionReminder';
import InstallPrompt from '../Components/InstallPrompt';
import { money } from '../lib/format';

function BasketIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M3 8h18l-1.6 10.4A2 2 0 0 1 17.4 20H6.6a2 2 0 0 1-2-1.6z" />
            <path d="M8 8V6a4 4 0 0 1 8 0v2" />
        </svg>
    );
}

// Bumps only when tickets are added, not on every page load.
let lastBasketCount = null;
function useRememberBasket(count) {
    useEffect(() => {
        lastBasketCount = count;
    }, [count]);
}
function BasketBadge({ count }) {
    const grew = lastBasketCount !== null && count > lastBasketCount;
    return (
        <span key={count} className={`${grew ? 'bump' : ''} num absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-hot px-1 text-[11px] font-bold text-white`}>
            {count}
        </span>
    );
}

function CompetitionsMenu({ categories }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, []);

    return (
        <div className="relative" ref={ref} onMouseLeave={() => setOpen(false)}>
            <button
                className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[15px] font-semibold text-cream/90 hover:text-white"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
                onMouseEnter={() => setOpen(true)}
            >
                Competitions
                <svg viewBox="0 0 12 8" className={`h-2 w-3 transition-transform duration-200 ease-out ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 1.5l5 5 5-5" /></svg>
            </button>
            {open && (
                <div className="absolute left-0 top-full z-50 pt-2">
                    <div className="pop-in w-64 overflow-hidden rounded-2xl border border-line bg-panel-2 p-2 shadow-2xl" style={{ '--origin': '1.5rem 0' }}>
                        <Link href="/raffles" className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-white hover:bg-violet/15">All competitions</Link>
                        <Link href="/raffles?tab=instant" className="block rounded-lg px-3 py-2.5 text-sm text-cream/90 hover:bg-violet/15">Instant wins</Link>
                        <div className="my-1 border-t border-line" />
                        {categories.map((c) => (
                            <Link key={c.key} href={`/raffles?category=${c.key}`} className="block rounded-lg px-3 py-2 text-sm text-cream/80 hover:bg-violet/15 hover:text-white">
                                {c.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function Newsletter() {
    const { data, setData, post, processing, errors, reset } = useForm({ newsletter_email: '', newsletter_consent: false });
    return (
        <section className="border-t border-line bg-gradient-to-br from-violet-deep/40 via-ink to-ink">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
                <div>
                    <h2 className="font-wide text-3xl sm:text-4xl">Join the club</h2>
                    <p className="mt-3 max-w-md text-cream/75">New competitions, flash sales and instant-win drops, straight to your inbox. One or two emails a week.</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); post('/newsletter', { preserveScroll: true, onSuccess: () => reset() }); }} className="space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                            type="email"
                            required
                            className="field h-12 flex-1"
                            placeholder="Your email address"
                            aria-label="Email address"
                            value={data.newsletter_email}
                            onChange={(e) => setData('newsletter_email', e.target.value)}
                        />
                        <button disabled={processing} className="btn btn-white h-12">Sign me up</button>
                    </div>
                    <label className="flex items-start gap-2.5 text-sm text-cream/75">
                        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#7b5cfa]" checked={data.newsletter_consent} onChange={(e) => setData('newsletter_consent', e.target.checked)} />
                        I’m 18 or over and happy to receive marketing emails. Unsubscribe any time.
                    </label>
                    {(errors.newsletter_email || errors.newsletter_consent) && <p className="text-sm text-ruby">{errors.newsletter_email || errors.newsletter_consent}</p>}
                </form>
            </div>
        </section>
    );
}

export default function SiteLayout({ children, newsletter = true }) {
    const page = usePage();
    const { auth, basket, company, ticker, categories, app } = page.props;
    const url = page.url;
    const [open, setOpen] = useState(false);
    useEffect(() => setOpen(false), [url]);
    useRememberBasket(basket.count);

    const isActive = (href) => url === href || url.startsWith(href + '/') || url.startsWith(href + '?');
    const nav = [
        ['/winners', 'Winners'],
        ['/free-entry', 'Free entry'],
        ['/how-it-works', 'How it works'],
    ];

    return (
        <div className="flex min-h-screen flex-col">
            <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-violet focus:px-4 focus:py-2 focus:text-white">
                Skip to content
            </a>
            <Ticker items={ticker} />
            {auth.user?.excluded_until && (
                <div className="bg-amber/15 px-4 py-2 text-center text-sm text-amber">
                    You’re on a break until {new Date(auth.user.excluded_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. You can view tickets and withdraw, but not enter.{' '}
                    <Link href="/account/safer-play" className="underline">Details</Link>
                </div>
            )}
            <header className="sticky top-0 z-40 border-b border-line/80 bg-ink/90 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:h-[72px] lg:px-8">
                    <Logo />
                    <nav className="ml-8 hidden items-center gap-1 lg:flex" aria-label="Main">
                        <CompetitionsMenu categories={categories} />
                        {nav.map(([href, label]) => (
                            <Link key={href} href={href} className={`rounded-lg px-3.5 py-2 text-[15px] font-semibold transition-colors ${isActive(href) ? 'text-violet-hi' : 'text-cream/90 hover:text-white'}`}>
                                {label}
                            </Link>
                        ))}
                    </nav>
                    <div className="ml-auto flex items-center gap-2">
                        {auth.user && auth.user.wallet_balance_cents > 0 && (
                            <Link href="/account/wallet" className="hidden items-center gap-1.5 rounded-full border border-amber/30 bg-amber/10 px-3 py-1.5 text-sm font-bold text-amber hover:border-amber/60 md:flex" title="Wallet balance">
                                <span aria-hidden="true">●</span><span className="num">{money(auth.user.wallet_balance_cents, app.currency)}</span>
                            </Link>
                        )}
                        {auth.user && <NotificationBell />}
                        <Link
                            href="/basket"
                            onClick={(e) => {
                                if (url.startsWith('/basket') || e.metaKey || e.ctrlKey) return;
                                e.preventDefault();
                                showBasket();
                            }}
                            className="pressable relative rounded-lg p-2.5 text-cream hover:text-violet-hi"
                            aria-label={`Basket, ${basket.count} tickets`}
                        >
                            <BasketIcon />
                            {basket.count > 0 && (
                                <BasketBadge count={basket.count} />
                            )}
                        </Link>
                        {auth.user ? (
                            <div className="hidden items-center gap-2 sm:flex">
                                {auth.user.is_admin && <Link href="/admin" className="btn btn-ghost btn-sm">Admin</Link>}
                                <Link href="/account" className="btn btn-ghost btn-sm">My tickets</Link>
                                <Link href="/logout" method="post" as="button" className="px-2 text-sm text-mist hover:text-white">Log out</Link>
                            </div>
                        ) : (
                            <div className="hidden items-center gap-2 sm:flex">
                                <Link href="/login" className="btn btn-ghost btn-sm">Log in</Link>
                                <Link href="/register" className="btn btn-primary btn-sm">Create account</Link>
                            </div>
                        )}
                        <button className="pressable rounded-lg p-2.5 lg:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">
                            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
                            </svg>
                        </button>
                    </div>
                </div>
                {open && (
                    <div className="drop-in max-h-[80vh] overflow-y-auto border-t border-line px-4 pb-6 pt-2 lg:hidden">
                        <Link href="/raffles" className="block border-b border-line/60 py-3.5 font-semibold">All competitions</Link>
                        <div className="grid grid-cols-2 gap-x-4 border-b border-line/60 py-2">
                            {categories.map((c) => (
                                <Link key={c.key} href={`/raffles?category=${c.key}`} className="py-2 text-sm text-cream/80">{c.label}</Link>
                            ))}
                        </div>
                        {nav.map(([href, label]) => (
                            <Link key={href} href={href} className="block border-b border-line/60 py-3.5 font-semibold">{label}</Link>
                        ))}
                        <div className="mt-5 grid grid-cols-2 gap-3">
                            {auth.user ? (
                                <>
                                    <Link href="/account" className="btn btn-ghost btn-sm">My tickets</Link>
                                    <Link href="/logout" method="post" as="button" className="btn btn-ghost btn-sm">Log out</Link>
                                    {auth.user.is_admin && <Link href="/admin" className="btn btn-ghost btn-sm col-span-2">Admin</Link>}
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className="btn btn-ghost btn-sm">Log in</Link>
                                    <Link href="/register" className="btn btn-primary btn-sm">Create account</Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </header>

            <main id="main" className="flex-1">{children}</main>

            {newsletter && <div className="mt-24"><Newsletter /></div>}

            <footer className={`border-t border-line bg-ink-2 ${newsletter ? '' : 'mt-24'}`}>
                <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-8">
                    <div className="max-w-sm">
                        <Logo />
                        <p className="mt-5 text-sm leading-relaxed text-mist">
                            Prize competitions with a fixed number of tickets, a published draw time and instant wins. Every competition can also be entered for free.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-md border border-line-2 px-2.5 py-1 font-bold">18+</span>
                            <Link href="/responsible-play" className="rounded-md border border-line-2 px-2.5 py-1 text-cream/80 hover:text-white">Play responsibly</Link>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white">Competitions</h2>
                        <ul className="mt-4 space-y-2.5 text-sm text-mist">
                            <li><Link href="/raffles" className="hover:text-white">All competitions</Link></li>
                            <li><Link href="/raffles?tab=instant" className="hover:text-white">Instant wins</Link></li>
                            <li><Link href="/raffles?category=cars" className="hover:text-white">Cars</Link></li>
                            <li><Link href="/raffles?category=watches" className="hover:text-white">Watches</Link></li>
                            <li><Link href="/raffles?category=cash" className="hover:text-white">Cash</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white">Help</h2>
                        <ul className="mt-4 space-y-2.5 text-sm text-mist">
                            <li><Link href="/how-it-works" className="hover:text-white">How it works and FAQ</Link></li>
                            <li><Link href="/free-entry" className="hover:text-white">Enter for free</Link></li>
                            <li><Link href="/winners" className="hover:text-white">Winners</Link></li>
                            <li><a href={`mailto:${company.email}`} className="hover:text-white">Contact us</a></li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white">Legal</h2>
                        <ul className="mt-4 space-y-2.5 text-sm text-mist">
                            <li><Link href="/terms" className="hover:text-white">Terms &amp; Conditions</Link></li>
                            <li><Link href="/terms#free-entry" className="hover:text-white">Free entry route</Link></li>
                            <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                            <li><Link href="/responsible-play" className="hover:text-white">Responsible play</Link></li>
                            <li><Link href="/cookies" className="hover:text-white">Cookie Policy</Link></li>
                            <li><button onClick={openCookieSettings} className="hover:text-white">Cookie settings</button></li>
                        </ul>
                    </div>
                </div>
                <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {[['/raffles', 'All'], ['/raffles?tab=instant', 'Instant wins'], ['/raffles?category=cars', 'Cars'], ['/raffles?category=watches', 'Watches'], ['/raffles?category=cash', 'Cash'], ['/raffles?category=tech', 'Tech'], ['/free-entry', 'Free to play'], ['/winners', 'Winners']].map(([href, label]) => (
                            <Link key={label} href={href} className="rounded-lg border border-line-2 py-2.5 text-center text-sm font-semibold text-cream/85 hover:border-violet hover:text-white">
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="border-t border-line">
                    <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-mist sm:px-6 md:flex-row md:justify-between lg:px-8">
                        <p>© {new Date().getFullYear()} {company.name}. Company no. {company.number}. {company.address}</p>
                        <a href={`mailto:${company.email}`} className="hover:text-white">{company.email}</a>
                    </div>
                </div>
            </footer>
            <Flash />
            <BasketDrawer />
            <CookieBanner />
            <SessionReminder />
            <InstallPrompt />
        </div>
    );
}
