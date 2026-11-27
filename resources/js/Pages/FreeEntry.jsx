import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import SiteLayout from '../Layouts/SiteLayout';
import Media from '../Components/Media';
import { Checkbox } from '../Components/Form';
import { date, dateTime } from '../lib/format';

/* A real sequence, so it's numbered. */
const STEPS = [
    ['Pick a competition', 'One free entry per person for each competition.'],
    ['Get your entry code', 'A personal code, issued straight away. One per person per competition.'],
    ['Email it to us', 'From your account’s email, using our short template, before the draw.'],
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

function RequestRow({ r, onShow }) {
    const stage = { awaiting_email: 1, pending: 2, approved: 3 }[r.status] ?? -1;
    const labels = ['Code issued', 'Email received', 'Ticket issued'];
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
                {r.status === 'awaiting_email' && (
                    <button type="button" onClick={() => onShow(r.reference)} className="mt-2.5 text-xs font-semibold text-violet-hi hover:text-white">Show the email to send</button>
                )}
            </div>
        </li>
    );
}

function CopyButton({ text, label }) {
    const [done, setDone] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setDone(true);
            setTimeout(() => setDone(false), 1600);
        } catch {}
    };
    return (
        <button type="button" onClick={copy} className="pressable shrink-0 rounded-lg border border-line-2 px-2.5 py-1 text-xs font-semibold text-cream/85 hover:border-violet hover:text-white" aria-label={`Copy ${label}`}>
            <span key={String(done)} className="swap-in">{done ? 'Copied ✓' : 'Copy'}</span>
        </button>
    );
}

/** Step 2: the email the player sends us, ready to copy or open in their mail app. */
function EmailPanel({ req, mailTo, fromEmail, onClose, highlight }) {
    const mailto = `mailto:${mailTo}?subject=${encodeURIComponent(req.subject)}&body=${encodeURIComponent(req.template)}`;
    const ref = useRef(null);
    useEffect(() => {
        if (highlight) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [highlight, req.reference]);

    return (
        <div ref={ref} key={req.reference} className="swap-in scroll-mt-28 rounded-[22px] border border-violet/50 bg-gradient-to-b from-violet/[0.12] to-panel/80 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm text-mist">Your entry code for {req.raffle}</p>
                    <p className="num mt-1 whitespace-nowrap font-wide text-2xl tracking-wide sm:text-[1.7rem] text-white">{req.reference}</p>
                </div>
                <CopyButton text={req.reference} label="entry code" />
            </div>

            <p className="mt-4 text-sm leading-relaxed text-cream/85">
                Now email us from <span className="font-semibold text-white">{fromEmail}</span> before the draw{req.draws_at ? ` on ${dateTime(req.draws_at)}` : ''}. Replace everything in [brackets] with your details.
            </p>

            <dl className="mt-4 space-y-3 text-sm">
                <div className="rounded-xl bg-ink-2 p-3">
                    <div className="flex items-center justify-between gap-2"><dt className="text-xs text-mist">To</dt><CopyButton text={mailTo} label="address" /></div>
                    <dd className="mt-1 break-all text-white">{mailTo}</dd>
                </div>
                <div className="rounded-xl bg-ink-2 p-3">
                    <div className="flex items-center justify-between gap-2"><dt className="text-xs text-mist">Subject</dt><CopyButton text={req.subject} label="subject" /></div>
                    <dd className="mt-1 text-white">{req.subject}</dd>
                </div>
                <div className="rounded-xl bg-ink-2 p-3">
                    <div className="flex items-center justify-between gap-2"><dt className="text-xs text-mist">Message</dt><CopyButton text={req.template} label="message" /></div>
                    <dd>
                        <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-cream/90">
                            {req.template.split(/(\[[^\]]+\])/g).map((part, i) =>
                                part.startsWith('[') ? <mark key={i} className="rounded bg-amber/15 px-0.5 text-amber">{part}</mark> : part,
                            )}
                        </pre>
                    </dd>
                </div>
            </dl>

            <a href={mailto} className="btn btn-primary mt-5 w-full">Open in my email app</a>
            <p className="mt-3 text-xs text-mist">We’ve also emailed you this code and template. One code per person per competition; it only works from your account’s email address.</p>
            {onClose && <button type="button" onClick={onClose} className="mt-3 w-full py-1 text-sm text-mist hover:text-white">Hide</button>}
        </div>
    );
}

export default function FreeEntry({ raffles, selected, prefill, requests, excludedUntil, mailTo, justIssued }) {
    const { company, auth, categories } = usePage().props;
    const signedIn = !!auth.user;
    const available = raffles.filter((r) => !r.already_requested);
    const initial = available.find((r) => String(r.id) === String(selected) || r.slug === selected)?.id ?? '';
    const ids = { group: useId() };

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({ raffle_id: initial, confirm: false });
    const [openCode, setOpenCode] = useState(justIssued ?? null);
    useEffect(() => {
        if (justIssued) setOpenCode(justIssued);
    }, [justIssued]);
    const openReq = requests.find((r) => r.reference === openCode);
    const [cat, setCat] = useState('all');
    const [limit, setLimit] = useState(12);
    const formRef = useRef(null);

    const usedCats = useMemo(() => new Set(raffles.map((r) => r.category)), [raffles]);
    const shown = raffles.filter((r) => cat === 'all' || r.category === cat);
    const chosen = raffles.find((r) => String(r.id) === String(data.raffle_id));

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
            onSuccess: () => reset('confirm', 'raffle_id'),
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
                    {openReq && (
                        <div className="mb-6">
                            <EmailPanel req={openReq} mailTo={mailTo} fromEmail={prefill?.email} highlight onClose={() => setOpenCode(null)} />
                        </div>
                    )}
                    <div className="rounded-[22px] border border-line bg-panel/80 p-5 sm:p-6">
                        {chosen ? (
                            <div key={chosen.id} className="swap-in flex items-center gap-3">
                                <span className="h-14 w-20 shrink-0 overflow-hidden rounded-xl">
                                    <Media src={chosen.image_url} category={chosen.category} title={chosen.title} />
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate font-semibold text-white">{chosen.title}</span>
                                    <span className="block text-xs text-mist">Draw {dateTime(chosen.draws_at)}. Your email must arrive before entries close.</span>
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
                                <ol className="space-y-3 text-sm text-cream/80">
                                    <li className="flex gap-3"><span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet/20 text-xs font-bold text-violet-hi">1</span>Get your personal entry code here.</li>
                                    <li className="flex gap-3"><span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet/20 text-xs font-bold text-violet-hi">2</span><span>Email it to <span className="text-white">{mailTo}</span> from <span className="text-white">{prefill.email}</span>, using our template.</span></li>
                                    <li className="flex gap-3"><span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet/20 text-xs font-bold text-violet-hi">3</span>We check it and add your free ticket.</li>
                                </ol>
                                <Checkbox checked={data.confirm} onChange={(e) => { setData('confirm', e.target.checked); errors.confirm && clearErrors('confirm'); }} error={errors.confirm}>
                                    I’ve read the <Link href="/terms#free-entry" className="text-violet-hi underline underline-offset-2">free entry rules</Link>.
                                </Checkbox>
                                <button type="submit" disabled={processing || !chosen} className="btn btn-primary h-12 w-full text-base">
                                    <span key={String(processing)} className="swap-in inline-flex items-center gap-2">
                                        {processing && (
                                            <svg viewBox="0 0 24 24" className="spinner h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                                                <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
                                            </svg>
                                        )}
                                        {processing ? 'Getting your code…' : 'Get my entry code'}
                                    </span>
                                </button>
                            </form>
                        )}

                        <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-mist">
                            Full rules: <Link href="/terms#free-entry" className="text-cream underline underline-offset-2">Terms, section 6</Link>.
                        </p>
                    </div>

                    {requests.length > 0 && (
                        <div className="mt-6">
                            <h2 className="font-wide text-lg text-white">Your requests</h2>
                            <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel/50">
                                {requests.map((r) => <RequestRow key={r.reference} r={r} onShow={setOpenCode} />)}
                            </ul>
                        </div>
                    )}
                </div>
            </section>
        </SiteLayout>
    );
}
