import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useId, useMemo, useRef, useState } from 'react';
import SiteLayout from '../Layouts/SiteLayout';
import Media from '../Components/Media';
import { Checkbox } from '../Components/Form';
import { date, dateTime } from '../lib/format';

const MIN_WORDS = 20; // characters, matches the server rule

/* A real sequence, so it's numbered. */
const STEPS = [
    ['Pick a competition', 'One free entry per person for each competition.'],
    ['Write a short request', 'In your own words. Automated or bulk requests aren’t accepted.'],
    ['Get your ticket', 'We check it, usually within one working day, and email your ticket number.'],
];

function PrizeOption({ raffle, selected, onSelect, name }) {
    const disabled = raffle.already_requested;
    return (
        <label
            className={`pressable group relative block cursor-pointer overflow-hidden rounded-2xl border bg-panel transition-[border-color,box-shadow] duration-150 ${
                selected ? 'border-violet shadow-[0_0_0_3px_rgba(123,92,250,0.35)]' : 'border-line hover:border-line-2'
            } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
            <input type="radio" name={name} value={raffle.id} checked={selected} disabled={disabled} onChange={() => onSelect(raffle.id)} className="peer sr-only" />
            <span className="block aspect-[4/3] overflow-hidden">
                <Media src={raffle.image_url} category={raffle.category} title={raffle.title} className="transition-transform duration-300 ease-out group-hover:scale-[1.03]" />
            </span>
            <span className="block p-3">
                <span className="line-clamp-2 text-sm font-semibold leading-snug text-white">{raffle.title}</span>
                <span className="mt-1 block text-xs text-mist">Draw {date(raffle.draws_at)}</span>
            </span>
            {selected && (
                <span className="pop-in absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full bg-violet text-white shadow-lg" aria-hidden="true">
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M3 8.5l3 3 7-7" /></svg>
                </span>
            )}
            {disabled && <span className="absolute left-2.5 top-2.5 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-semibold text-cream backdrop-blur">Requested</span>}
            <span className="pointer-events-none absolute inset-0 rounded-2xl peer-focus-visible:ring-2 peer-focus-visible:ring-violet-hi" aria-hidden="true" />
        </label>
    );
}

function RequestRow({ r }) {
    const stage = r.status === 'approved' ? 3 : r.status === 'rejected' ? -1 : 1;
    const labels = ['Sent', 'Checked', 'Ticket issued'];
    return (
        <li className="flex gap-4 p-4">
            <Link href={`/raffles/${r.raffle_slug}`} className="h-14 w-20 shrink-0 overflow-hidden rounded-xl">
                <Media src={r.image_url} category={r.category} title={r.raffle} />
            </Link>
            <div className="min-w-0 flex-1">
                <Link href={`/raffles/${r.raffle_slug}`} className="block truncate font-semibold text-white hover:text-violet-hi">{r.raffle}</Link>
                <p className="num text-xs text-mist">{r.reference}, sent {date(r.created_at)}</p>
                {stage === -1 ? (
                    <p className="mt-2 text-xs text-ruby">Not accepted. Check the email we sent for the reason.</p>
                ) : (
                    <ol className="mt-2.5 flex items-center gap-1.5 text-[11px]" aria-label="Request status">
                        {labels.map((l, i) => (
                            <li key={l} className="flex items-center gap-1.5">
                                <span className={`h-1.5 w-8 rounded-full ${i < stage ? 'bg-jade' : 'bg-line'}`} aria-hidden="true" />
                                <span className={i < stage ? 'text-[#8fd9c1]' : 'text-mist'}>{l}</span>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </li>
    );
}

export default function FreeEntry({ raffles, selected, prefill, requests, excludedUntil }) {
    const { company, auth, categories } = usePage().props;
    const signedIn = !!auth.user;
    const available = raffles.filter((r) => !r.already_requested);
    const initial = available.find((r) => String(r.id) === String(selected) || r.slug === selected)?.id ?? '';
    const ids = { name: useId(), email: useId(), address: useId(), statement: useId(), group: useId() };

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        raffle_id: initial,
        full_name: prefill?.full_name ?? '',
        email: prefill?.email ?? '',
        address: prefill?.address ?? '',
        statement: '',
        confirm: false,
    });
    const [cat, setCat] = useState('all');
    const [limit, setLimit] = useState(12);
    const [editDetails, setEditDetails] = useState(false);
    const formRef = useRef(null);

    const usedCats = useMemo(() => new Set(raffles.map((r) => r.category)), [raffles]);
    const shown = raffles.filter((r) => cat === 'all' || r.category === cat);
    const chosen = raffles.find((r) => String(r.id) === String(data.raffle_id));
    const chars = data.statement.trim().length;

    const pick = (id) => {
        setData('raffle_id', id);
        clearErrors('raffle_id');
        // On phones the form sits below the grid; bring it into view once a prize is picked.
        if (window.matchMedia('(max-width: 1023px)').matches) {
            requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post('/free-entry', {
            preserveScroll: true,
            onSuccess: () => reset('statement', 'confirm', 'raffle_id'),
            onError: (errs) => (errs.full_name || errs.email || errs.address) && setEditDetails(true),
        });
    };

    return (
        <SiteLayout>
            <Head title="Enter for free" />

            <section
                className="border-b border-line"
                style={{ background: 'radial-gradient(55% 80% at 85% 20%, rgba(62,207,160,0.10), transparent 70%), radial-gradient(50% 70% at 15% 0%, rgba(123,92,250,0.18), transparent 70%)' }}
            >
                <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1fr_1.15fr] lg:items-end lg:px-8">
                    <div>
                        <h1 className="font-wide text-4xl leading-[1.02] text-white sm:text-6xl">Play for free</h1>
                        <p className="mt-4 max-w-md text-lg text-cream/80">
                            You never have to buy a ticket. A free entry goes into the same draw and has exactly the same chance of winning as a paid one.
                        </p>
                    </div>
                    <ol className="grid gap-3 sm:grid-cols-3">
                        {STEPS.map(([t, d], i) => (
                            <li key={t} className="rounded-2xl border border-line bg-ink-2/70 p-4 backdrop-blur">
                                <span className="num grid h-8 w-8 place-items-center rounded-full bg-jade/15 text-sm font-bold text-[#8fd9c1]">{i + 1}</span>
                                <p className="mt-3 font-semibold text-white">{t}</p>
                                <p className="mt-1 text-sm leading-relaxed text-mist">{d}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section className="mx-auto grid max-w-6xl gap-10 px-4 pt-10 sm:px-6 lg:grid-cols-[1fr_24rem] lg:px-8">
                {/* Competitions */}
                <div className="min-w-0">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <h2 id={ids.group} className="font-wide text-2xl text-white">Choose a competition</h2>
                        <p className="text-sm text-mist">{available.length} open for free entry</p>
                    </div>

                    <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter by category">
                        {[{ key: 'all', label: 'All' }, ...categories.filter((c) => usedCats.has(c.key))].map((c) => (
                            <button
                                key={c.key}
                                type="button"
                                onClick={() => { setCat(c.key); setLimit(12); }}
                                aria-pressed={cat === c.key}
                                className={`pressable shrink-0 rounded-full border px-4 py-2 text-sm transition-colors duration-150 ${cat === c.key ? 'border-violet bg-violet text-white' : 'border-line-2 text-cream/80 hover:border-violet'}`}
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>

                    {raffles.length === 0 ? (
                        <p className="mt-6 rounded-2xl border border-dashed border-line-2 p-10 text-center text-mist">No competitions are open right now. New ones open every week.</p>
                    ) : (
                        <>
                            <div role="radiogroup" aria-labelledby={ids.group} className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {shown.slice(0, limit).map((r) => (
                                    <PrizeOption key={r.id} raffle={r} selected={String(r.id) === String(data.raffle_id)} onSelect={pick} name="raffle" />
                                ))}
                            </div>
                            {shown.length > limit && (
                                <button type="button" onClick={() => setLimit((l) => l + 12)} className="btn btn-ghost mt-5 w-full">
                                    Show more ({shown.length - limit})
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Request form */}
                <div ref={formRef} className="min-w-0 scroll-mt-28 lg:sticky lg:top-28 lg:self-start">
                    <div className="rounded-[22px] border border-line bg-panel/80 p-5 sm:p-6">
                        {chosen ? (
                            <div key={chosen.id} className="swap-in flex items-center gap-3">
                                <span className="h-14 w-20 shrink-0 overflow-hidden rounded-xl">
                                    <Media src={chosen.image_url} category={chosen.category} title={chosen.title} />
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate font-semibold text-white">{chosen.title}</span>
                                    <span className="block text-xs text-mist">Draw {dateTime(chosen.draws_at)}. Your request must arrive before entries close.</span>
                                </span>
                            </div>
                        ) : (
                            <p className="rounded-xl border border-dashed border-line-2 px-4 py-5 text-center text-sm text-mist">Pick a competition to request your free ticket.</p>
                        )}
                        {errors.raffle_id && <p className="mt-3 text-sm text-ruby" role="alert">{errors.raffle_id}</p>}

                        {!signedIn ? (
                            <div className="mt-5 border-t border-line pt-5">
                                <p className="font-semibold text-white">Sign in to send your request</p>
                                <p className="mt-1 text-sm text-mist">We need an account so we can check your age and send your ticket number.</p>
                                <div className="mt-4 grid gap-2">
                                    <Link href="/login" className="btn btn-primary">Sign in</Link>
                                    <Link href="/register" className="btn btn-ghost">Create an account</Link>
                                </div>
                            </div>
                        ) : excludedUntil ? (
                            <p className="mt-5 rounded-xl bg-amber/10 p-4 text-sm text-amber">
                                You’re on a break until {date(excludedUntil)}, so you can’t enter competitions right now. <Link href="/account/safer-play" className="underline">Safer play</Link>
                            </p>
                        ) : available.length === 0 ? (
                            <p className="mt-5 text-sm text-mist">You’ve already requested a free entry for every open competition. New ones open every week.</p>
                        ) : (
                            <form onSubmit={submit} noValidate className="mt-5 space-y-5 border-t border-line pt-5">
                                <div>
                                    <div className="flex items-baseline justify-between">
                                        <p className="text-sm font-semibold text-cream/90">Sending as</p>
                                        <button type="button" onClick={() => setEditDetails((v) => !v)} className="text-sm text-violet-hi hover:text-white" aria-expanded={editDetails}>
                                            {editDetails ? 'Done' : 'Edit'}
                                        </button>
                                    </div>
                                    {editDetails ? (
                                        <div className="swap-in mt-3 space-y-3">
                                            {[
                                                ['full_name', 'Full name', ids.name, 'name'],
                                                ['email', 'Email', ids.email, 'email'],
                                                ['address', 'Postal address', ids.address, 'street-address'],
                                            ].map(([k, l, id, ac]) => (
                                                <div key={k}>
                                                    <label htmlFor={id} className="mb-1.5 block text-xs text-mist">{l}</label>
                                                    <input id={id} className="field h-11" autoComplete={ac} type={k === 'email' ? 'email' : 'text'} value={data[k]} onChange={(e) => setData(k, e.target.value)} aria-invalid={errors[k] ? 'true' : undefined} />
                                                    {errors[k] && <p className="mt-1.5 text-sm text-ruby" role="alert">{errors[k]}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-2 rounded-xl bg-ink-2 px-4 py-3 text-sm leading-relaxed">
                                            <p className="text-white">{data.full_name}</p>
                                            <p className="text-cream/70">{data.email}</p>
                                            <p className="text-cream/70">{data.address}</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="mb-2 flex items-baseline justify-between">
                                        <label htmlFor={ids.statement} className="text-sm font-semibold text-cream/90">Your request</label>
                                        <span className={`num text-xs transition-colors duration-150 ${chars >= MIN_WORDS ? 'text-[#8fd9c1]' : 'text-mist'}`} aria-live="polite">
                                            {chars >= MIN_WORDS ? '✓' : `${chars}/${MIN_WORDS}`}
                                        </span>
                                    </div>
                                    <textarea
                                        id={ids.statement}
                                        rows={4}
                                        className="field min-h-28 resize-y py-3"
                                        placeholder={chosen ? `For example: I would like to enter the ${chosen.title} competition for free.` : 'For example: I would like to enter … for free.'}
                                        value={data.statement}
                                        onChange={(e) => { setData('statement', e.target.value); errors.statement && clearErrors('statement'); }}
                                        aria-invalid={errors.statement ? 'true' : undefined}
                                    />
                                    {errors.statement ? <p className="mt-2 text-sm text-ruby" role="alert">{errors.statement}</p> : <p className="mt-2 text-xs text-mist">Write it in your own words.</p>}
                                </div>

                                <Checkbox checked={data.confirm} onChange={(e) => { setData('confirm', e.target.checked); errors.confirm && clearErrors('confirm'); }} error={errors.confirm}>
                                    These details are correct and I’ve read the <Link href="/terms#free-entry" className="text-violet-hi underline underline-offset-2">free entry rules</Link>.
                                </Checkbox>

                                <button type="submit" disabled={processing || !chosen} className="btn btn-primary h-12 w-full text-base">
                                    <span key={String(processing)} className="swap-in inline-flex items-center gap-2">
                                        {processing && (
                                            <svg viewBox="0 0 24 24" className="spinner h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                                                <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
                                            </svg>
                                        )}
                                        {processing ? 'Sending…' : 'Send free entry request'}
                                    </span>
                                </button>
                            </form>
                        )}

                        <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-mist">
                            Prefer email? Send the same details to <a href={`mailto:${company.free_entry_email}`} className="text-cream underline underline-offset-2">{company.free_entry_email}</a> from the address on your account. Full rules: <Link href="/terms#free-entry" className="text-cream underline underline-offset-2">Terms, section 6</Link>.
                        </p>
                    </div>

                    {requests.length > 0 && (
                        <div className="mt-6">
                            <h2 className="font-wide text-lg text-white">Your requests</h2>
                            <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel/50">
                                {requests.map((r) => <RequestRow key={r.reference} r={r} />)}
                            </ul>
                        </div>
                    )}
                </div>
            </section>
        </SiteLayout>
    );
}
