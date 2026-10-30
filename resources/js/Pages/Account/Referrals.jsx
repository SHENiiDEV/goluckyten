import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import AccountShell from './AccountShell';
import { date, money } from '../../lib/format';

export default function Referrals({ link, code, bonus_cents, min_spend_cents, friends, earned_cents }) {
    const { app } = usePage().props;
    const cur = app.currency;
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {}
    };
    const share = () => navigator.share?.({ title: 'GoLuckyTen', text: `Win cars, watches and cash from 10c a ticket. We both get ${money(bonus_cents, cur)} when you join:`, url: link });

    return (
        <AccountShell title="Invite friends" intro={`Give ${money(bonus_cents, cur)}, get ${money(bonus_cents, cur)}. When a friend joins with your link and spends ${money(min_spend_cents, cur)} or more, you both get ${money(bonus_cents, cur)} in your wallets.`}>
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <div className="card p-6 sm:p-8">
                    <p className="text-sm font-semibold text-mist">Your link</p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <input readOnly value={link} onFocus={(e) => e.target.select()} className="field h-12 flex-1 font-mono text-sm" aria-label="Your referral link" />
                        <button onClick={copy} className="btn btn-primary h-12 min-w-32">
                            <span key={copied ? 'y' : 'n'} className="swap-in">{copied ? 'Copied ✓' : 'Copy link'}</span>
                        </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {typeof navigator !== 'undefined' && navigator.share && <button onClick={share} className="btn btn-ghost btn-sm">Share…</button>}
                        <a className="btn btn-ghost btn-sm" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`Join me on GoLuckyTen: ${link}`)}`}>WhatsApp</a>
                        <a className="btn btn-ghost btn-sm" href={`mailto:?subject=${encodeURIComponent('Try GoLuckyTen')}&body=${encodeURIComponent(`Win cars, watches and cash from 10c a ticket. Sign up with my link and we both get ${money(bonus_cents, cur)}: ${link}`)}`}>Email</a>
                    </div>
                    <p className="mt-6 text-xs text-mist">Code <span className="font-mono text-cream">{code}</span>. Bonuses are paid once per friend, to real new players over 18. Self-referrals and duplicate accounts are void. See the Terms, section “Referrals”.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="card p-6"><p className="text-sm text-mist">Friends joined</p><p className="num mt-2 font-wide text-4xl">{friends.length}</p></div>
                    <div className="card p-6"><p className="text-sm text-mist">You’ve earned</p><p className="num mt-2 font-wide text-4xl text-amber">{money(earned_cents, cur)}</p></div>
                    <ol className="card col-span-2 space-y-3 p-6 text-sm">
                        {['Share your link', `Your friend signs up and spends ${money(min_spend_cents, cur)}`, `You both get ${money(bonus_cents, cur)}`].map((t, i) => (
                            <li key={t} className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-violet/20 font-bold text-violet-hi">{i + 1}</span>{t}</li>
                        ))}
                    </ol>
                </div>
            </div>

            <h2 className="mt-12 font-display text-2xl">Your friends</h2>
            {friends.length === 0 ? (
                <p className="mt-4 rounded-2xl border border-dashed border-line-2 p-8 text-center text-mist">No one yet. Your first friend is one message away.</p>
            ) : (
                <ul className="mt-4 divide-y divide-line rounded-2xl border border-line">
                    {friends.map((f, i) => (
                        <li key={i} className="flex items-center justify-between px-5 py-4 text-sm">
                            <span><span className="font-semibold text-white">{f.name}</span> <span className="text-mist">joined {date(f.joined_at)}</span></span>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${f.rewarded ? 'bg-jade/10 text-jade' : 'bg-line text-mist'}`}>{f.rewarded ? `+${money(bonus_cents, cur)} paid` : 'Waiting for first entry'}</span>
                        </li>
                    ))}
                </ul>
            )}
        </AccountShell>
    );
}
