import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import SiteLayout from '../../Layouts/SiteLayout';
import Media from '../../Components/Media';
import { Checkbox } from '../../Components/Form';
import { money } from '../../lib/format';

/* The three steps really are a sequence, so they're numbered. Each knows its own fields,
   so a server error on submit sends the player back to the step that needs fixing. */
const STEPS = [
    { title: 'Your login', fields: ['email', 'password', 'password_confirmation'] },
    { title: 'About you', fields: ['name', 'surname', 'phone', 'date_of_birth'] },
    { title: 'Prize delivery', fields: ['address_line', 'city', 'post_code', 'country', 'terms'] },
];

function Field({ label, htmlFor, error, hint, children, className = '' }) {
    return (
        <div className={className}>
            <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-cream/90">{label}</label>
            {children}
            {error ? (
                <p id={`${htmlFor}-err`} className="mt-2 text-sm text-ruby" role="alert">{error}</p>
            ) : hint ? (
                <p className="mt-2 text-xs text-mist">{hint}</p>
            ) : null}
        </div>
    );
}

function TextInput({ id, error, className = '', ...props }) {
    return (
        <input
            id={id}
            className={`field h-12 ${className}`}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${id}-err` : undefined}
            {...props}
        />
    );
}

function Eye({ shown }) {
    return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            {shown && <path d="M4 4l16 16" />}
        </svg>
    );
}

/** Three checks that mirror the server rule (8+ characters, a letter, a number). */
function PasswordChecks({ value }) {
    const checks = [
        ['8+ characters', value.length >= 8],
        ['A letter', /[a-z]/i.test(value)],
        ['A number', /\d/.test(value)],
    ];
    return (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Password requirements">
            {checks.map(([label, ok]) => (
                <li key={label} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors duration-150 ${ok ? 'bg-jade/15 text-[#8fd9c1]' : 'bg-line text-mist'}`}>
                    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                        {ok ? <path d="M3 8.5l3 3 7-7" /> : <circle cx="8" cy="8" r="2.5" fill="currentColor" stroke="none" />}
                    </svg>
                    {label}
                    <span className="sr-only">{ok ? ' done' : ' needed'}</span>
                </li>
            ))}
        </ul>
    );
}

/** A ticket that fills in with the player's name as they type, for a real live competition. */
function TicketPreview({ spotlight, name, surname, city, cur }) {
    const holder = name ? `${name}${surname ? ` ${surname[0].toUpperCase()}.` : ''}` : 'Your name';
    return (
        <div className="signin-ticket relative w-full max-w-[420px] rounded-[26px] border border-line-2 bg-panel shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8),0_0_0_1px_rgba(123,92,250,0.08)]">
            {spotlight && (
                <div className="relative aspect-[16/10] overflow-hidden rounded-t-[26px]">
                    <Media src={spotlight.image_url} category={spotlight.category} title={spotlight.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/10 to-transparent" />
                    <span className="absolute left-4 top-4 rounded-full bg-ink/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                        {spotlight.promo_label || spotlight.category_label}
                    </span>
                </div>
            )}
            <div className="px-6 pb-5 pt-1">
                {spotlight ? (
                    <>
                        <h2 className="font-wide text-2xl leading-tight text-white">{spotlight.title}</h2>
                        <p className="mt-1 text-sm text-cream/70">
                            Worth <span className="num font-semibold text-amber">{money(spotlight.retail_value_cents, cur, { compact: true })}</span>
                        </p>
                    </>
                ) : (
                    <h2 className="pt-5 font-wide text-2xl leading-tight text-white">Your first ticket</h2>
                )}
            </div>

            <div className="relative" aria-hidden="true">
                <span className="ticket-notch ticket-notch-l" />
                <span className="ticket-notch ticket-notch-r" />
                <div className="ticket-tear mx-6" />
            </div>

            <div className="grid grid-cols-[1fr_auto] items-end gap-4 px-6 py-5">
                <div className="min-w-0">
                    <p className="text-xs text-mist">Ticket holder</p>
                    <p key={holder} className={`swap-in truncate font-wide text-xl ${name ? 'text-white' : 'text-mist/60'}`}>{holder}</p>
                    <p className="mt-0.5 h-4 truncate text-xs text-cream/60">{city}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-mist">From</p>
                    <p className="num font-wide text-xl text-white">{money(spotlight?.ticket_price_cents ?? 10, cur)}</p>
                </div>
            </div>
        </div>
    );
}

export default function Register({ countries, minAge, referrer, referralBonusCents, spotlight }) {
    const { app } = usePage().props;
    const cur = app.currency;
    const ids = { email: useId(), password: useId(), confirm: useId(), name: useId(), surname: useId(), phone: useId(), dob: useId(), address: useId(), city: useId(), post: useId(), country: useId() };
    const { data, setData, post, processing, errors, setError, clearErrors } = useForm({
        email: '',
        password: '',
        password_confirmation: '',
        name: '',
        surname: '',
        phone: '',
        date_of_birth: '',
        address_line: '',
        city: '',
        country: '',
        post_code: '',
        terms: false,
        profile_public: false,
    });
    const [step, setStep] = useState(0);
    const [dir, setDir] = useState(1);
    const [shown, setShown] = useState(false);
    const panel = useRef(null);

    const maxDob = useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - minAge);
        return d.toISOString().slice(0, 10);
    }, [minAge]);

    const set = (key) => (e) => {
        setData(key, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
        if (errors[key]) clearErrors(key);
    };

    /** Quick checks before moving on; the server still has the final word. */
    const check = (i) => {
        const e = {};
        const need = (k, msg) => !String(data[k] ?? '').trim() && (e[k] = msg);
        if (i === 0) {
            if (!/^\S+@\S+\.\S+$/.test(data.email.trim())) e.email = 'Enter a valid email address.';
            if (data.password.length < 8 || !/[a-z]/i.test(data.password) || !/\d/.test(data.password)) e.password = 'Use at least 8 characters with a letter and a number.';
            if (data.password_confirmation !== data.password) e.password_confirmation = 'The passwords don’t match.';
        }
        if (i === 1) {
            need('name', 'Enter your first name.');
            need('surname', 'Enter your surname.');
            if (!/^\+?\d{7,15}$/.test(data.phone.replace(/[^\d+]/g, ''))) e.phone = 'Enter a phone number with country code, e.g. +371 20 000 000.';
            if (!data.date_of_birth) e.date_of_birth = 'Enter your date of birth.';
            else if (data.date_of_birth > maxDob) e.date_of_birth = `You must be at least ${minAge} years old to play.`;
        }
        if (i === 2) {
            need('address_line', 'Enter your street, house number and apartment.');
            need('city', 'Enter your city.');
            need('post_code', 'Enter your post code.');
            need('country', 'Choose your country.');
            if (!data.terms) e.terms = 'Please accept the Terms & Conditions and Privacy Policy to continue.';
        }
        if (Object.keys(e).length) {
            setError(e);
            requestAnimationFrame(() => panel.current?.querySelector('[aria-invalid="true"]')?.focus());
            return false;
        }
        return true;
    };

    const go = (to) => {
        setDir(to > step ? 1 : -1);
        setStep(to);
    };

    // Each step's first field has autoFocus; on small screens also bring the panel into view.
    const first = useRef(true);
    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        panel.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [step]);

    const next = (e) => {
        e.preventDefault();
        if (!check(step)) return;
        if (step < STEPS.length - 1) return go(step + 1);
        post('/register', {
            onError: (errs) => {
                const back = STEPS.findIndex((s) => s.fields.some((f) => errs[f]));
                if (back >= 0 && back !== step) go(back);
            },
        });
    };

    const pwd = (
        <button
            type="button"
            onClick={() => setShown((v) => !v)}
            className="pressable absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-mist hover:text-white"
            aria-label={shown ? 'Hide passwords' : 'Show passwords'}
            aria-pressed={shown}
        >
            <Eye shown={shown} />
        </button>
    );

    return (
        <SiteLayout newsletter={false}>
            <Head title="Create account" />
            <section
                className="relative"
                style={{ background: 'radial-gradient(60% 70% at 78% 40%, rgba(123,92,250,0.16), transparent 70%), radial-gradient(40% 45% at 70% 90%, rgba(255,61,154,0.07), transparent 70%)' }}
            >
                <div className="relative mx-auto grid max-w-6xl items-start gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,32rem)_1fr] lg:gap-20 lg:px-8">
                    <div className="w-full">
                        <h1 className="font-wide text-4xl leading-[1.02] text-white sm:text-5xl">Create your account</h1>
                        <p className="mt-3 max-w-md text-cream/75">Three short steps. We use your real details only to verify winners and deliver prizes. They’re never shown publicly.</p>

                        {referrer && (
                            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber/30 bg-amber/10 p-4 text-sm text-amber">
                                <span className="text-2xl" aria-hidden="true">🎁</span>
                                <span><strong>{referrer}</strong> invited you. Make your first entry of €1 or more and you’ll both get {money(referralBonusCents, cur)} in your wallets.</span>
                            </div>
                        )}

                        {/* Stepper */}
                        <ol className="mt-8 grid grid-cols-3 gap-2" aria-label="Sign-up progress">
                            {STEPS.map((s, i) => {
                                const done = i < step;
                                const current = i === step;
                                return (
                                    <li key={s.title}>
                                        <button
                                            type="button"
                                            onClick={() => i < step && go(i)}
                                            disabled={i > step}
                                            aria-current={current ? 'step' : undefined}
                                            className="group w-full text-left disabled:cursor-default"
                                        >
                                            <span className="block h-1 overflow-hidden rounded-full bg-line">
                                                <span className={`block h-full origin-left rounded-full bg-gradient-to-r from-violet to-[#ff3d9a] transition-transform duration-300 ease-out ${done || current ? 'scale-x-100' : 'scale-x-0'}`} />
                                            </span>
                                            <span className={`mt-2.5 flex items-center gap-2 text-sm ${current ? 'font-semibold text-white' : done ? 'text-cream/80 group-hover:text-white' : 'text-mist'}`}>
                                                <span className={`num grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${done ? 'bg-jade/20 text-[#8fd9c1]' : current ? 'bg-violet text-white' : 'bg-line text-mist'}`}>
                                                    {done ? '✓' : i + 1}
                                                </span>
                                                <span className="truncate">{s.title}</span>
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ol>

                        <form onSubmit={next} noValidate className="mt-6">
                            <div ref={panel} key={step} className="step-panel rounded-[22px] border border-line bg-panel/70 p-6 sm:p-8" style={{ '--dir': dir }}>
                                <h2 className="font-wide text-xl text-white" aria-live="polite">
                                    {STEPS[step].title}
                                </h2>

                                {step === 0 && (
                                    <div className="mt-6 space-y-5">
                                        <Field label="Email" htmlFor={ids.email} error={errors.email}>
                                            <TextInput id={ids.email} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} autoFocus value={data.email} onChange={set('email')} error={errors.email} />
                                        </Field>
                                        <Field label="Password" htmlFor={ids.password} error={errors.password}>
                                            <div className="relative">
                                                <TextInput id={ids.password} type={shown ? 'text' : 'password'} autoComplete="new-password" className="pr-12" value={data.password} onChange={set('password')} error={errors.password} />
                                                {pwd}
                                            </div>
                                            <PasswordChecks value={data.password} />
                                        </Field>
                                        <Field label="Repeat password" htmlFor={ids.confirm} error={errors.password_confirmation}>
                                            <TextInput id={ids.confirm} type={shown ? 'text' : 'password'} autoComplete="new-password" value={data.password_confirmation} onChange={set('password_confirmation')} error={errors.password_confirmation} />
                                        </Field>
                                    </div>
                                )}

                                {step === 1 && (
                                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                                        <Field label="First name" htmlFor={ids.name} error={errors.name}>
                                            <TextInput id={ids.name} autoComplete="given-name" autoFocus value={data.name} onChange={set('name')} error={errors.name} />
                                        </Field>
                                        <Field label="Surname" htmlFor={ids.surname} error={errors.surname}>
                                            <TextInput id={ids.surname} autoComplete="family-name" value={data.surname} onChange={set('surname')} error={errors.surname} />
                                        </Field>
                                        <Field label="Phone number" htmlFor={ids.phone} error={errors.phone} hint="With country code. We only call winners." className="sm:col-span-2">
                                            <TextInput id={ids.phone} type="tel" inputMode="tel" autoComplete="tel" placeholder="+371 20 000 000" value={data.phone} onChange={set('phone')} error={errors.phone} />
                                        </Field>
                                        <Field label="Date of birth" htmlFor={ids.dob} error={errors.date_of_birth} hint={`You must be ${minAge} or over to play.`} className="sm:col-span-2">
                                            <TextInput id={ids.dob} type="date" autoComplete="bday" max={maxDob} min="1900-01-02" value={data.date_of_birth} onChange={set('date_of_birth')} error={errors.date_of_birth} />
                                        </Field>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                                        <Field label="Street, house number, apartment" htmlFor={ids.address} error={errors.address_line} className="sm:col-span-2">
                                            <TextInput id={ids.address} autoComplete="street-address" placeholder="Brīvības iela 1, apt. 12" autoFocus value={data.address_line} onChange={set('address_line')} error={errors.address_line} />
                                        </Field>
                                        <Field label="City" htmlFor={ids.city} error={errors.city}>
                                            <TextInput id={ids.city} autoComplete="address-level2" value={data.city} onChange={set('city')} error={errors.city} />
                                        </Field>
                                        <Field label="Post code" htmlFor={ids.post} error={errors.post_code}>
                                            <TextInput id={ids.post} autoComplete="postal-code" value={data.post_code} onChange={set('post_code')} error={errors.post_code} />
                                        </Field>
                                        <Field label="Country" htmlFor={ids.country} error={errors.country} className="sm:col-span-2">
                                            <select id={ids.country} autoComplete="country" className="field h-12" value={data.country} onChange={set('country')} aria-invalid={errors.country ? 'true' : undefined}>
                                                <option value="" disabled>Select your country</option>
                                                {countries.map((c) => (
                                                    <option key={c.code} value={c.code}>{c.name}</option>
                                                ))}
                                            </select>
                                        </Field>
                                        <div className="space-y-4 border-t border-line pt-5 sm:col-span-2">
                                            <Checkbox checked={data.terms} onChange={set('terms')} error={errors.terms} name="terms">
                                                I agree to the{' '}
                                                <a href="/terms" target="_blank" rel="noopener" className="text-violet-hi underline underline-offset-2">Terms &amp; Conditions</a>{' '}
                                                and{' '}
                                                <a href="/privacy" target="_blank" rel="noopener" className="text-violet-hi underline underline-offset-2">Privacy Policy</a>.
                                            </Checkbox>
                                            <Checkbox checked={data.profile_public} onChange={set('profile_public')} name="profile_public">
                                                Show a public player profile: first name, surname initial, city, competitions and wins. You can turn it off any time.
                                            </Checkbox>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-8 flex items-center gap-3">
                                    {step > 0 && (
                                        <button type="button" onClick={() => go(step - 1)} className="btn btn-ghost h-12 px-5">Back</button>
                                    )}
                                    <button type="submit" disabled={processing} className="btn btn-primary h-12 flex-1 text-base">
                                        <span key={`${step}-${processing}`} className="swap-in inline-flex items-center gap-2">
                                            {processing && (
                                                <svg viewBox="0 0 24 24" className="spinner h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                                                    <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
                                                </svg>
                                            )}
                                            {processing ? 'Creating account…' : step < STEPS.length - 1 ? 'Continue' : 'Create account'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </form>

                        <p className="mt-6 text-center text-sm text-mist">
                            Already have an account? <Link href="/login" className="text-violet-hi hover:text-white">Sign in</Link>
                        </p>
                    </div>

                    <aside className="sticky top-28 hidden justify-center pt-24 lg:flex" aria-label="Ticket preview">
                        <div className="w-full max-w-[420px]">
                            <TicketPreview spotlight={spotlight} name={data.name.trim()} surname={data.surname.trim()} city={data.city.trim()} cur={cur} />
                            <ul className="mt-10 space-y-3 text-sm text-cream/75">
                                <li className="flex gap-3"><span className="text-violet-hi" aria-hidden="true">●</span>Tickets from {money(spotlight?.ticket_price_cents ?? 10, cur)}, and every competition has a free entry route.</li>
                                <li className="flex gap-3"><span className="text-violet-hi" aria-hidden="true">●</span>Each draw publishes its seed, so anyone can check the result.</li>
                                <li className="flex gap-3"><span className="text-violet-hi" aria-hidden="true">●</span>Set spend limits or take a break any time in Safer play.</li>
                            </ul>
                        </div>
                    </aside>
                </div>
            </section>
        </SiteLayout>
    );
}
