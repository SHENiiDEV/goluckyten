import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useId, useRef, useState } from 'react';
import SiteLayout from '../../Layouts/SiteLayout';
import Media from '../../Components/Media';
import { Checkbox } from '../../Components/Form';
import useCountdown from '../../lib/useCountdown';
import { money, number, pct } from '../../lib/format';

const pad = (n) => String(n).padStart(2, '0');

function Field({ label, error, children, aside, htmlFor }) {
    return (
        <div>
            <div className="mb-2 flex items-baseline justify-between gap-3">
                <label htmlFor={htmlFor} className="text-sm font-semibold text-cream/90">{label}</label>
                {aside}
            </div>
            {children}
            {error && <p className="mt-2 text-sm text-ruby" role="alert">{error}</p>}
        </div>
    );
}

function PasswordInput({ id, value, onChange, error }) {
    const [shown, setShown] = useState(false);
    const [caps, setCaps] = useState(false);
    const checkCaps = (e) => setCaps(e.getModifierState?.('CapsLock') ?? false);

    return (
        <>
            <div className="relative">
                <input
                    id={id}
                    type={shown ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="field h-12 pr-12"
                    value={value}
                    onChange={onChange}
                    onKeyUp={checkCaps}
                    onKeyDown={checkCaps}
                    onBlur={() => setCaps(false)}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={caps ? `${id}-caps` : undefined}
                />
                <button
                    type="button"
                    onClick={() => setShown((v) => !v)}
                    className="pressable absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-mist hover:text-white"
                    aria-label={shown ? 'Hide password' : 'Show password'}
                    aria-pressed={shown}
                >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                        <circle cx="12" cy="12" r="3" />
                        {shown && <path d="M4 4l16 16" />}
                    </svg>
                </button>
            </div>
            {caps && (
                <p id={`${id}-caps`} className="mt-2 text-sm text-amber">Caps Lock is on.</p>
            )}
        </>
    );
}

/** A live competition, printed as a ticket. Tilts a little towards the pointer on desktop. */
function SpotlightTicket({ raffle, liveCount, cur }) {
    const ref = useRef(null);
    const t = useCountdown(raffle.draws_at);
    const sold = pct(raffle.tickets_sold, raffle.max_tickets);

    useEffect(() => {
        const el = ref.current;
        const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!el || !fine || calm) return;
        const stage = el.parentElement;
        const move = (e) => {
            const r = stage.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            el.classList.add('is-tracking');
            el.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`);
            el.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
        };
        const leave = () => {
            el.classList.remove('is-tracking');
            el.style.setProperty('--ry', '0deg');
            el.style.setProperty('--rx', '0deg');
        };
        stage.addEventListener('pointermove', move);
        stage.addEventListener('pointerleave', leave);
        return () => {
            stage.removeEventListener('pointermove', move);
            stage.removeEventListener('pointerleave', leave);
        };
    }, []);

    return (
        <Link
            ref={ref}
            href={`/raffles/${raffle.slug}`}
            className="signin-ticket group relative block w-full max-w-[440px] rounded-[26px] border border-line-2 bg-panel shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8),0_0_0_1px_rgba(123,92,250,0.08)] outline-none focus-visible:ring-2 focus-visible:ring-violet-hi"
            aria-label={`${raffle.title}, drawn in ${t.days} days ${t.hours} hours. View competition.`}
        >
            <div className="relative aspect-[16/10] overflow-hidden rounded-t-[26px]">
                <Media src={raffle.image_url} category={raffle.category} title={raffle.title} imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
                <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/10 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-ink/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    {raffle.promo_label || raffle.category_label}
                </span>
            </div>

            <div className="px-6 pb-6">
                <p className="text-sm text-mist">{raffle.brand ?? raffle.category_label}</p>
                <h2 className="mt-0.5 font-wide text-2xl leading-tight text-white">{raffle.title}</h2>
                <p className="mt-1 text-sm text-cream/75">
                    Worth <span className="num font-semibold text-amber">{money(raffle.retail_value_cents, cur, { compact: true })}</span>
                    {raffle.cash_alternative_cents ? <>, or <span className="num">{money(raffle.cash_alternative_cents, cur, { compact: true })}</span> cash</> : null}
                </p>

                <div className="mt-5 grid grid-cols-4 gap-2 text-center" aria-hidden="true">
                    {[[t.days, 'days'], [t.hours, 'hrs'], [t.minutes, 'min'], [t.seconds, 'sec']].map(([v, l]) => (
                        <div key={l} className="rounded-xl bg-ink-2 py-2.5">
                            <div className="num font-wide text-xl text-white">{pad(v)}</div>
                            <div className="text-[11px] text-mist">{l}</div>
                        </div>
                    ))}
                </div>

                <div className="mt-5">
                    <div className="h-1.5 overflow-hidden rounded-full bg-line">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet to-[#ff3d9a]" style={{ width: `${Math.max(2, sold)}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-mist">
                        <span className="num text-cream">{number(raffle.tickets_remaining)}</span> of {number(raffle.max_tickets)} tickets left
                    </p>
                </div>
            </div>

            <div className="relative" aria-hidden="true">
                <span className="ticket-notch ticket-notch-l" />
                <span className="ticket-notch ticket-notch-r" />
                <div className="ticket-tear mx-6" />
            </div>

            <div className="flex items-center justify-between px-6 py-4">
                <div>
                    <p className="num font-wide text-lg text-white">{money(raffle.ticket_price_cents, cur)}</p>
                    <p className="text-xs text-mist">per ticket</p>
                </div>
                <div className="text-right">
                    <p className="num font-wide text-lg text-white">{number(liveCount)}</p>
                    <p className="text-xs text-mist">{liveCount === 1 ? 'competition live' : 'competitions live'}</p>
                </div>
            </div>
        </Link>
    );
}

export default function Login({ status, spotlight, liveCount }) {
    const { app } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({ email: '', password: '', remember: true });
    const emailId = useId();
    const passId = useId();
    const formRef = useRef(null);

    // A short shake says "that didn't work" without moving focus or clearing what was typed.
    const shake = () => {
        const el = formRef.current;
        if (!el) return;
        el.classList.remove('shake');
        void el.offsetWidth;
        el.classList.add('shake');
    };

    const submit = (e) => {
        e.preventDefault();
        post('/login', { onError: shake, preserveScroll: true });
    };

    return (
        <SiteLayout newsletter={false}>
            <Head title="Sign in" />
            <section
                className="relative"
                style={{ background: 'radial-gradient(60% 70% at 78% 45%, rgba(123,92,250,0.16), transparent 70%), radial-gradient(40% 45% at 70% 90%, rgba(255,61,154,0.07), transparent 70%)' }}
            >
                <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:min-h-[calc(100svh-12rem)] lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-20 lg:px-8">
                    <div className="w-full max-w-md">
                        <h1 className="font-wide text-4xl leading-[1.02] text-white sm:text-5xl">Welcome back</h1>
                        <p className="mt-3 text-cream/75">Sign in to see your tickets, wallet and upcoming draws.</p>

                        {status && (
                            <p className="mt-6 rounded-xl border border-jade/40 bg-jade/10 px-4 py-3 text-sm text-[#8fd9c1]" role="status">{status}</p>
                        )}

                        <form ref={formRef} onSubmit={submit} noValidate className="mt-8 space-y-5" onAnimationEnd={(e) => e.currentTarget.classList.remove('shake')}>
                            <Field label="Email" htmlFor={emailId} error={errors.email}>
                                <input
                                    id={emailId}
                                    type="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    autoCapitalize="none"
                                    spellCheck={false}
                                    autoFocus
                                    className="field h-12"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    aria-invalid={errors.email ? 'true' : undefined}
                                />
                            </Field>

                            <Field
                                label="Password"
                                htmlFor={passId}
                                error={errors.password}
                                aside={<Link href="/forgot-password" className="text-sm text-violet-hi hover:text-white">Forgot password?</Link>}
                            >
                                <PasswordInput id={passId} value={data.password} onChange={(e) => setData('password', e.target.value)} error={errors.password} />
                            </Field>

                            <Checkbox checked={data.remember} onChange={(e) => setData('remember', e.target.checked)}>Keep me signed in on this device</Checkbox>

                            <button type="submit" disabled={processing} className="btn btn-primary h-12 w-full text-base">
                                <span key={processing ? 'busy' : 'idle'} className="swap-in inline-flex items-center gap-2">
                                    {processing && (
                                        <svg viewBox="0 0 24 24" className="spinner h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                                            <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
                                        </svg>
                                    )}
                                    {processing ? 'Signing in…' : 'Sign in'}
                                </span>
                            </button>
                        </form>

                        <div className="mt-8 rounded-2xl border border-line bg-panel/60 p-5">
                            <p className="font-semibold text-white">New to GoLuckyTen?</p>
                            <p className="mt-1 text-sm text-mist">Create a free account in about a minute. Tickets start at 10c, and every competition has a free entry route.</p>
                            <Link href="/register" className="btn btn-ghost mt-4 w-full">Create an account</Link>
                        </div>

                        {spotlight && (
                            <Link href={`/raffles/${spotlight.slug}`} className="pressable mt-6 flex items-center gap-4 rounded-2xl border border-line p-3 lg:hidden">
                                <span className="h-14 w-20 shrink-0 overflow-hidden rounded-xl">
                                    <Media src={spotlight.image_url} category={spotlight.category} title={spotlight.title} />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-xs text-mist">{spotlight.promo_label || spotlight.category_label}</span>
                                    <span className="block truncate font-semibold text-white">{spotlight.title}</span>
                                    <span className="block text-xs text-cream/70">{money(spotlight.ticket_price_cents, app.currency)} a ticket</span>
                                </span>
                            </Link>
                        )}
                    </div>

                    <div className="relative hidden h-full min-h-[34rem] items-center justify-center lg:flex">
                        {spotlight ? (
                            <SpotlightTicket raffle={spotlight} liveCount={liveCount} cur={app.currency} />
                        ) : (
                            <img src="/images/brand/mark-ticket.webp" alt="" className="w-72 opacity-90" />
                        )}
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
