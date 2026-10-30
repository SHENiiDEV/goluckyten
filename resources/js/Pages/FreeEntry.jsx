import { Head, Link, useForm, usePage } from '@inertiajs/react';
import SiteLayout from '../Layouts/SiteLayout';
import { Checkbox, Input, Select, Textarea } from '../Components/Form';
import StatusBadge from '../Components/StatusBadge';
import { date, dateTime } from '../lib/format';

export default function FreeEntry({ raffles, selected, prefill, requests }) {
    const { company } = usePage().props;
    const available = raffles.filter((r) => !r.already_requested);
    const initial = available.find((r) => String(r.id) === String(selected))?.id ?? '';

    const { data, setData, post, processing, errors, reset } = useForm({
        raffle_id: initial,
        full_name: prefill.full_name,
        email: prefill.email,
        address: prefill.address,
        statement: '',
        confirm: false,
    });

    const chosen = raffles.find((r) => String(r.id) === String(data.raffle_id));

    const submit = (e) => {
        e.preventDefault();
        post('/free-entry', { preserveScroll: true, onSuccess: () => reset('statement', 'confirm', 'raffle_id') });
    };

    return (
        <SiteLayout>
            <Head title="Enter for free" />
            <section className="mx-auto grid max-w-6xl gap-12 px-4 pt-12 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8">
                <div>
                    <h1 className="font-display text-5xl leading-tight">Enter for free</h1>
                    <p className="mt-4 text-lg text-cream/75">
                        You never have to buy a ticket to play. Send us a request and we’ll add one free ticket to your account — it goes into the same draw and has
                        exactly the same chance of winning.
                    </p>
                    <ol className="mt-10 space-y-6">
                        {[
                            ['Choose the raffle', 'One free entry per person for each raffle.'],
                            ['Write your request in your own words', 'For example: “I’d like to enter the Electric GT coupé raffle for free.” Automated or bulk requests are not accepted.'],
                            ['We check and confirm it', 'Usually within one working day. You’ll get an email with your ticket number.'],
                        ].map(([t, d], i) => (
                            <li key={t} className="flex gap-4">
                                <span className="num grid h-9 w-9 shrink-0 place-items-center rounded-full border border-jade/50 font-display text-[#8fd9c1]">{i + 1}</span>
                                <div>
                                    <p className="font-semibold">{t}</p>
                                    <p className="mt-1 text-sm text-mist">{d}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                    <div className="mt-10 rounded-2xl border border-line p-5 text-sm text-cream/80">
                        <p>
                            Prefer email? Send the same details to{' '}
                            <a href={`mailto:${company.free_entry_email}`} className="text-gold-hi underline">{company.free_entry_email}</a> from the address on your account.
                        </p>
                        <p className="mt-2 text-mist">Full rules are in section 6 of our <Link href="/terms#free-entry" className="underline">Terms &amp; Conditions</Link>.</p>
                    </div>
                </div>

                <div>
                    <form onSubmit={submit} className="card space-y-5 p-6 sm:p-8">
                        {available.length === 0 ? (
                            <p className="text-mist">You’ve sent a free entry request for every raffle that’s open right now. New raffles open every week.</p>
                        ) : (
                            <>
                                <Select label="Raffle" value={data.raffle_id} onChange={(e) => setData('raffle_id', e.target.value)} error={errors.raffle_id}>
                                    <option value="" disabled>Choose a raffle</option>
                                    {raffles.map((r) => (
                                        <option key={r.id} value={r.id} disabled={r.already_requested}>
                                            {r.title}{r.already_requested ? ' (already requested)' : ''}
                                        </option>
                                    ))}
                                </Select>
                                {chosen && <p className="-mt-2 text-xs text-mist">Draw {dateTime(chosen.draws_at)}. Requests must arrive before entries close.</p>}
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Input label="Full name" value={data.full_name} onChange={(e) => setData('full_name', e.target.value)} error={errors.full_name} />
                                    <Input label="Email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} />
                                </div>
                                <Input label="Postal address" value={data.address} onChange={(e) => setData('address', e.target.value)} error={errors.address} />
                                <Textarea
                                    label="Your request"
                                    placeholder={chosen ? `I would like to enter the ${chosen.title} raffle for free.` : 'I would like to enter … for free.'}
                                    value={data.statement}
                                    onChange={(e) => setData('statement', e.target.value)}
                                    error={errors.statement}
                                    hint="In your own words, at least 20 characters."
                                />
                                <Checkbox checked={data.confirm} onChange={(e) => setData('confirm', e.target.checked)} error={errors.confirm}>
                                    These details are correct and I’ve read the <Link href="/terms#free-entry" className="text-gold-hi underline">free entry rules</Link>.
                                </Checkbox>
                                <button type="submit" disabled={processing} className="btn btn-gold w-full">Send free entry request</button>
                            </>
                        )}
                    </form>

                    {requests.length > 0 && (
                        <div className="mt-8">
                            <h2 className="font-display text-2xl">Your requests</h2>
                            <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line">
                                {requests.map((r) => (
                                    <li key={r.reference} className="flex items-center justify-between gap-4 bg-panel/50 px-4 py-3 text-sm">
                                        <div className="min-w-0">
                                            <Link href={`/raffles/${r.raffle_slug}`} className="block truncate hover:text-gold-hi">{r.raffle}</Link>
                                            <span className="num text-xs text-mist">{r.reference}, sent {date(r.created_at)}</span>
                                        </div>
                                        <StatusBadge status={r.status} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </section>
        </SiteLayout>
    );
}
