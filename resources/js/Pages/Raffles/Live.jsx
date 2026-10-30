import { Head, Link, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import SiteLayout from '../../Layouts/SiteLayout';
import Media from '../../Components/Media';
import PlayerName from '../../Components/PlayerName';
import useCountdown from '../../lib/useCountdown';
import { json } from '../../lib/http';
import { dateTime, number } from '../../lib/format';

const pad = (n) => String(n).padStart(2, '0');
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Slot-style reel: each digit spins, then settles left to right on the winning number. */
function Reel({ target, digits, spinning, onDone }) {
    const [shown, setShown] = useState(() => (target ? String(target).padStart(digits, '0') : '0'.repeat(digits)).split(''));
    const [settled, setSettled] = useState(target && !spinning ? digits : 0);

    useEffect(() => {
        if (!spinning) return;
        const final = target ? String(target).padStart(digits, '0').split('') : null;
        if (reduced() && final) {
            setShown(final);
            setSettled(digits);
            onDone?.();
            return;
        }
        let lock = 0;
        setSettled(0);
        const spin = setInterval(() => {
            setShown((cur) => cur.map((d, i) => (final && i < lock ? final[i] : String(Math.floor(Math.random() * 10)))));
        }, 60);
        const timers = [];
        if (final) {
            for (let i = 0; i < digits; i++) {
                timers.push(setTimeout(() => {
                    lock = i + 1;
                    setSettled(i + 1);
                    setShown((cur) => cur.map((d, j) => (j <= i ? final[j] : d)));
                    if (i === digits - 1) {
                        clearInterval(spin);
                        setTimeout(() => onDone?.(), 350);
                    }
                }, 1400 + i * 650));
            }
        }
        return () => {
            clearInterval(spin);
            timers.forEach(clearTimeout);
        };
    }, [spinning, target]);

    return (
        <div className="flex justify-center gap-1.5 sm:gap-2.5" aria-live="polite" aria-label={settled === digits && target ? `Winning ticket ${target}` : 'Drawing'}>
            {shown.map((d, i) => (
                <span key={i} className={`num grid h-20 w-12 place-items-center rounded-xl border text-5xl font-extrabold sm:h-28 sm:w-[4.5rem] sm:text-7xl ${i < settled ? 'border-violet bg-violet/20 text-white' : 'border-line-2 bg-ink-2 text-cream/70'}`}>
                    <span key={i < settled ? `s${d}` : 'spin'} className={i < settled ? 'reveal-pop' : ''}>{d}</span>
                </span>
            ))}
        </div>
    );
}

async function hex(buf) {
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function Verify({ raffleId, state }) {
    const [result, setResult] = useState(null);
    const run = async () => {
        const enc = new TextEncoder();
        const hash = await hex(await crypto.subtle.digest('SHA-256', enc.encode(state.seed)));
        const key = await crypto.subtle.importKey('raw', enc.encode(state.seed), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const mac = await hex(await crypto.subtle.sign('HMAC', key, enc.encode(`${raffleId}:${state.audit.ticket_count}`)));
        const index = parseInt(mac.slice(0, 13), 16) % state.audit.ticket_count;
        setResult({ hashOk: hash === state.seed_hash, index, indexOk: index === state.audit.index });
    };

    return (
        <div className="mt-4 space-y-3 text-sm">
            <button onClick={run} className="btn btn-primary btn-sm">Check it in my browser</button>
            {result && (
                <ul className="swap-in space-y-1.5">
                    <li className={result.hashOk ? 'text-jade' : 'text-ruby'}>{result.hashOk ? '✓' : '✗'} The revealed seed matches the hash we published before the draw.</li>
                    <li className={result.indexOk ? 'text-jade' : 'text-ruby'}>{result.indexOk ? '✓' : '✗'} HMAC gives position {number(result.index)} of {number(state.audit.ticket_count)} → ticket #{number(state.audit.winning_number)}.</li>
                </ul>
            )}
        </div>
    );
}

export default function Live({ raffle, state: initial, myNumbers }) {
    const [state, setState] = useState(initial);
    const [phase, setPhase] = useState(initial.status === 'drawn' ? 'done' : 'waiting'); // waiting | spinning | done
    const [revealed, setRevealed] = useState(initial.status === 'drawn');
    const skew = useRef(new Date(initial.server_now).getTime() - Date.now());
    const t = useCountdown(new Date(new Date(state.draws_at).getTime() - skew.current).toISOString());
    const digits = Math.max(3, String(state.max_tickets).length);
    const mineWon = state.winner && myNumbers.includes(state.winner.number);

    const poll = useCallback(async () => {
        try {
            const next = await json(`/raffles/${raffle.slug}/live/status`);
            setState(next);
            if (next.status === 'drawn' && phase !== 'done') setPhase('spinning');
        } catch {}
    }, [raffle.slug, phase]);

    useEffect(() => {
        if (phase === 'done') return;
        const soon = t.done || t.totalHours < 0.05;
        if (t.done && phase === 'waiting') setPhase('spinning');
        const id = setInterval(poll, soon ? 3000 : 20000);
        return () => clearInterval(id);
    }, [phase, t.done, t.totalHours < 0.05, poll]);

    const replay = () => {
        setRevealed(false);
        setPhase('spinning');
    };

    return (
        <SiteLayout newsletter={false}>
            <Head title={`Live draw: ${raffle.title}`} />
            <section className="relative overflow-hidden border-b border-line">
                <div aria-hidden="true" className="absolute inset-0 opacity-25"><Media src={raffle.image_url} title="" /></div>
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/90 to-ink" />
                <div className="relative mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-20">
                    <p className="inline-flex items-center gap-2 rounded-full border border-hot/40 bg-hot/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-hot">
                        <span className={`h-2 w-2 rounded-full bg-hot ${phase !== 'done' ? 'live-dot' : ''}`} />
                        {phase === 'done' ? 'Draw complete' : phase === 'spinning' ? 'Drawing now' : 'Live draw'}
                    </p>
                    <h1 className="mt-5 font-wide text-3xl leading-tight sm:text-5xl">{raffle.title}</h1>
                    <p className="mt-3 text-cream/75">{number(state.ticket_count)} tickets in the draw · scheduled {dateTime(state.draws_at)}</p>

                    <div className="mt-10">
                        {phase === 'waiting' ? (
                            <div className="flex justify-center gap-3">
                                {[[t.days, 'days'], [t.hours, 'hours'], [t.minutes, 'mins'], [t.seconds, 'secs']].map(([v, l]) => (
                                    <div key={l} className="w-20 rounded-2xl border border-line-2 bg-ink-2/80 py-4 sm:w-24">
                                        <div className="num font-wide text-4xl sm:text-5xl">{pad(v)}</div>
                                        <div className="mt-1 text-xs uppercase tracking-wider text-mist">{l}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Reel target={state.winner?.number} digits={digits} spinning={phase === 'spinning'} onDone={() => { setPhase('done'); setRevealed(true); }} />
                        )}
                    </div>

                    {phase === 'spinning' && !state.winner && <p className="mt-6 text-sm text-mist">Waiting for the draw to run. This page updates by itself.</p>}

                    {revealed && state.winner && (
                        <div className="reveal-pop winner-glow mx-auto mt-10 max-w-md rounded-[24px] border border-violet bg-panel-2/90 p-6">
                            <p className="text-sm text-mist">Winning ticket #{number(state.winner.number)}</p>
                            <p className="mt-1 font-wide text-3xl"><PlayerName name={state.winner.name} id={state.winner.id} /></p>
                            {state.winner.city && <p className="text-mist">{state.winner.city}</p>}
                            {mineWon && <p className="mt-4 rounded-xl bg-amber/15 px-4 py-3 font-bold text-amber">That’s you! Check your email, we’ll be in touch within 48 hours.</p>}
                        </div>
                    )}
                    {phase === 'done' && <button onClick={replay} className="mt-6 text-sm font-semibold text-violet-hi hover:text-white">↻ Replay the draw</button>}
                </div>
            </section>

            <section className="mx-auto grid max-w-5xl gap-6 px-4 pt-12 sm:px-6 lg:grid-cols-2">
                <div className="card p-6">
                    <h2 className="font-display text-2xl">How this draw is fair</h2>
                    <ol className="mt-4 space-y-3 text-sm text-cream/85">
                        <li><strong className="text-white">1. Commit.</strong> When the competition opened we generated a secret random seed and published its SHA-256 fingerprint below. We can’t change the seed later without the fingerprint changing.</li>
                        <li><strong className="text-white">2. Draw.</strong> At draw time all issued tickets are sorted by number. The winner is the ticket at position <span className="font-mono text-xs">HMAC-SHA256(seed, "{raffle.id}:ticket_count")</span>, first 13 hex digits, mod ticket_count.</li>
                        <li><strong className="text-white">3. Reveal.</strong> After the draw we publish the seed so anyone can repeat the sums.</li>
                    </ol>
                    <Link href="/terms#draw" className="mt-4 inline-block text-sm text-violet-hi hover:text-white">Draw rules in the Terms →</Link>
                </div>
                <div className="card min-w-0 p-6">
                    <h2 className="font-display text-2xl">Verification</h2>
                    <dl className="mt-4 space-y-3 text-sm">
                        <div><dt className="text-mist">Published seed fingerprint (SHA-256)</dt><dd className="mt-1 break-all font-mono text-xs text-cream">{state.seed_hash ?? '—'}</dd></div>
                        <div><dt className="text-mist">Seed</dt><dd className="mt-1 break-all font-mono text-xs text-cream">{state.seed ?? (state.legacy ? 'Not applicable' : 'Revealed after the draw')}</dd></div>
                        {state.audit && (
                            <div className="grid grid-cols-3 gap-3">
                                <div><dt className="text-mist">Tickets</dt><dd className="num font-bold">{number(state.audit.ticket_count)}</dd></div>
                                <div><dt className="text-mist">Position</dt><dd className="num font-bold">{number(state.audit.index)}</dd></div>
                                <div><dt className="text-mist">Winning #</dt><dd className="num font-bold text-violet-hi">{number(state.audit.winning_number)}</dd></div>
                            </div>
                        )}
                    </dl>
                    {state.seed && state.audit ? (
                        <>
                            <Verify raffleId={raffle.id} state={state} />
                            <a href={`/raffles/${raffle.slug}/live/tickets.txt`} className="mt-3 inline-block text-sm text-violet-hi hover:text-white">Download all ticket numbers in draw order</a>
                        </>
                    ) : (
                        <p className="mt-4 text-sm text-mist">{state.legacy ? 'This draw was made before public verification was introduced, so there is no seed to check.' : 'Come back after the draw to check it yourself.'}</p>
                    )}
                </div>
                {myNumbers.length > 0 && (
                    <div className="card p-6 lg:col-span-2">
                        <h2 className="font-display text-xl">Your tickets in this draw</h2>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {myNumbers.map((n) => (
                                <span key={n} className={`num rounded-md px-2 py-1 text-xs font-semibold ${state.winner?.number === n ? 'bg-amber text-ink' : 'bg-violet/15 text-violet-hi'}`}>{number(n)}</span>
                            ))}
                        </div>
                    </div>
                )}
            </section>
            <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
                <Link href={`/raffles/${raffle.slug}`} className="text-sm text-mist hover:text-white">← Back to the competition</Link>
            </div>
        </SiteLayout>
    );
}
