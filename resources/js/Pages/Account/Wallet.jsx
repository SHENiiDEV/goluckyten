import { Link, useForm, usePage } from '@inertiajs/react';
import AccountShell from './AccountShell';
import Pagination from '../../Components/Pagination';
import { Input } from '../../Components/Form';
import { date, money } from '../../lib/format';

const typeLabel = { instant_win: 'Instant win', referral: 'Referral bonus', purchase: 'Tickets', withdrawal: 'Withdrawal', refund: 'Refund', adjustment: 'Adjustment' };
const statusTone = { pending: 'text-amber bg-amber/10', paid: 'text-jade bg-jade/10', rejected: 'text-ruby bg-ruby/10' };

export default function Wallet({ balance_cents, min_withdrawal_cents, transactions, withdrawals, defaultName }) {
    const { app } = usePage().props;
    const cur = app.currency;
    const form = useForm({ amount: '', account_name: defaultName, iban: '' });
    const canWithdraw = balance_cents >= min_withdrawal_cents;

    return (
        <AccountShell title="Wallet" intro="Cash instant wins and referral bonuses land here. Spend it on tickets at checkout, or withdraw it to your bank.">
            <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
                <div className="relative overflow-hidden rounded-[28px] border border-violet/40 bg-gradient-to-br from-violet-deep via-[#3a1f9c] to-ink p-7 sm:p-9">
                    <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-violet-hi/25 blur-3xl" />
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Available balance</p>
                    <p className="num mt-3 font-wide text-6xl text-white sm:text-7xl">{money(balance_cents, cur)}</p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link href="/raffles" className="btn btn-white">Spend on tickets</Link>
                        <a href="#withdraw" className="btn border border-white/30 text-white hover:bg-white/10">Withdraw</a>
                    </div>
                    <p className="mt-6 text-xs text-white/60">Wallet money never expires. It isn’t a deposit account and earns no interest.</p>
                </div>

                <form id="withdraw" onSubmit={(e) => { e.preventDefault(); form.post('/account/wallet/withdraw', { preserveScroll: true, onSuccess: () => form.reset('amount', 'iban') }); }} className="card space-y-4 p-6 sm:p-8">
                    <h2 className="font-display text-2xl">Withdraw to bank</h2>
                    <p className="text-sm text-mist">Minimum {money(min_withdrawal_cents, cur)}. We pay to an account in your name within 3 working days.</p>
                    <Input label={`Amount (${cur})`} type="number" step="0.01" min={min_withdrawal_cents / 100} max={balance_cents / 100} inputMode="decimal"
                        value={form.data.amount} onChange={(e) => form.setData('amount', e.target.value)} error={form.errors.amount || form.errors.wallet} disabled={!canWithdraw}
                        hint={canWithdraw ? <button type="button" className="text-violet-hi" onClick={() => form.setData('amount', (balance_cents / 100).toFixed(2))}>Withdraw everything</button> : null} />
                    <Input label="Account holder" value={form.data.account_name} onChange={(e) => form.setData('account_name', e.target.value)} error={form.errors.account_name} disabled={!canWithdraw} />
                    <Input label="IBAN" placeholder="GB29 NWBK 6016 1331 9268 19" value={form.data.iban} onChange={(e) => form.setData('iban', e.target.value.toUpperCase())} error={form.errors.iban} disabled={!canWithdraw} autoComplete="off" />
                    <button disabled={!canWithdraw || form.processing} className="btn btn-primary w-full">
                        {canWithdraw ? 'Request withdrawal' : `You need ${money(min_withdrawal_cents - balance_cents, cur)} more to withdraw`}
                    </button>
                </form>
            </div>

            {withdrawals.length > 0 && (
                <div className="mt-10">
                    <h2 className="font-display text-2xl">Withdrawals</h2>
                    <ul className="mt-4 divide-y divide-line rounded-2xl border border-line">
                        {withdrawals.map((w) => (
                            <li key={w.id} className="flex flex-wrap items-center gap-3 px-5 py-4 text-sm">
                                <span className="num font-bold">{money(w.amount_cents, cur)}</span>
                                <span className="text-mist">to {w.iban}</span>
                                <span className="text-mist">{date(w.created_at)}</span>
                                <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${statusTone[w.status]}`}>{w.status}</span>
                                {w.admin_note && <p className="w-full text-xs text-mist">{w.admin_note}</p>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="mt-10">
                <h2 className="font-display text-2xl">History</h2>
                {transactions.data.length === 0 ? (
                    <p className="mt-4 rounded-2xl border border-dashed border-line-2 p-8 text-center text-mist">
                        Nothing yet. Win a cash instant prize or <Link href="/account/referrals" className="text-violet-hi underline">invite a friend</Link> to get started.
                    </p>
                ) : (
                    <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
                        <table className="w-full min-w-[560px] text-sm">
                            <thead className="bg-panel text-left text-xs uppercase tracking-wider text-mist">
                                <tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Details</th><th className="px-5 py-3 text-right">Amount</th><th className="px-5 py-3 text-right">Balance</th></tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {transactions.data.map((t) => (
                                    <tr key={t.id}>
                                        <td className="whitespace-nowrap px-5 py-3.5 text-mist">{date(t.created_at)}</td>
                                        <td className="px-5 py-3.5"><span className="font-semibold text-white">{typeLabel[t.type] ?? t.type}</span><span className="block text-xs text-mist">{t.description}</span></td>
                                        <td className={`num whitespace-nowrap px-5 py-3.5 text-right font-bold ${t.amount_cents > 0 ? 'text-jade' : 'text-cream'}`}>{t.amount_cents > 0 ? '+' : '−'}{money(Math.abs(t.amount_cents), cur)}</td>
                                        <td className="num whitespace-nowrap px-5 py-3.5 text-right text-mist">{money(t.balance_after_cents, cur)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <Pagination links={transactions.links} />
            </div>
        </AccountShell>
    );
}
