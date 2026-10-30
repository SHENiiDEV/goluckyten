import { Head, useForm } from '@inertiajs/react';
import SiteLayout from '../../Layouts/SiteLayout';
import AccountNav from './AccountNav';
import { Checkbox, Input, Select } from '../../Components/Form';
import { Link } from '@inertiajs/react';
import { date } from '../../lib/format';
import { useState } from 'react';

function YourData() {
    const del = useForm({ password: '', confirm: '' });
    const [open, setOpen] = useState(false);
    return (
        <div id="your-data" className="card mt-8 grid gap-8 p-6 sm:p-8 lg:grid-cols-2">
            <div>
                <h2 className="font-display text-2xl">Your data</h2>
                <p className="mt-2 text-sm leading-relaxed text-cream/80">
                    Download a copy of everything we hold about you: profile, orders, tickets, wallet, free entries and notifications, as a JSON file. See the <Link href="/privacy" className="text-violet-hi underline">Privacy Policy</Link> for how we use it.
                </p>
                <a href="/account/data-export" className="btn btn-ghost mt-5">Download my data</a>
            </div>
            <div className="rounded-2xl border border-ruby/30 bg-ruby/[0.04] p-5">
                <h3 className="font-bold text-white">Close my account</h3>
                <p className="mt-1.5 text-sm text-cream/75">
                    We remove your name, contact details and address. Tickets and invoices stay, without anything that identifies you, because draws and tax records must be kept. Withdraw any wallet balance first.
                </p>
                {!open ? (
                    <button onClick={() => setOpen(true)} className="mt-4 text-sm font-semibold text-ruby underline underline-offset-4">I want to close my account</button>
                ) : (
                    <form onSubmit={(e) => { e.preventDefault(); del.delete('/account', { preserveScroll: true }); }} className="mt-4 space-y-3">
                        <Input label="Password" type="password" autoComplete="current-password" value={del.data.password} onChange={(e) => del.setData('password', e.target.value)} error={del.errors.password} />
                        <Input label="Type DELETE to confirm" value={del.data.confirm} onChange={(e) => del.setData('confirm', e.target.value)} error={del.errors.confirm} />
                        <div className="flex gap-2">
                            <button disabled={del.processing || del.data.confirm !== 'DELETE'} className="btn btn-sm bg-ruby text-white disabled:opacity-40">Close account permanently</button>
                            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">Cancel</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function Profile({ profile, countries, publicId }) {
    const form = useForm({ ...profile });
    const pw = useForm({ current_password: '', password: '', password_confirmation: '' });
    const bind = (key) => ({ value: form.data[key], onChange: (e) => form.setData(key, e.target.value), error: form.errors[key] });

    return (
        <SiteLayout>
            <Head title="Profile" />
            <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
                <h1 className="font-display text-5xl">Profile</h1>
                <AccountNav />
                <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
                    <form onSubmit={(e) => { e.preventDefault(); form.put('/account/profile', { preserveScroll: true }); }} className="card space-y-5 p-6 sm:p-8">
                        <h2 className="font-display text-2xl">Your details</h2>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Input label="Name" {...bind('name')} />
                            <Input label="Surname" {...bind('surname')} />
                            <Input label="Email" type="email" className="sm:col-span-2" {...bind('email')} />
                            <Input label="Phone number" type="tel" {...bind('phone')} />
                            <div>
                                <p className="mb-1.5 text-sm font-semibold text-cream/90">Date of birth</p>
                                <p className="field text-mist">{date(profile.date_of_birth)}</p>
                                <p className="mt-1.5 text-xs text-mist">Contact support to correct this.</p>
                            </div>
                            <Input label="Street, house number, apartment" className="sm:col-span-2" {...bind('address_line')} />
                            <Input label="City" {...bind('city')} />
                            <Input label="Post code" {...bind('post_code')} />
                            <Select label="Country" className="sm:col-span-2" {...bind('country')}>
                                {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                            </Select>
                        </div>
                        <div className="rounded-xl border border-line bg-ink-2 p-4">
                            <Checkbox checked={form.data.profile_public} onChange={(e) => form.setData('profile_public', e.target.checked)}>
                                Show my public player profile: first name, surname initial, city, competitions entered and wins. Your email, phone, address and spending are never shown.
                            </Checkbox>
                            <Link href={`/players/${publicId}`} className="mt-3 inline-block pl-8 text-sm font-semibold text-violet-hi underline underline-offset-4">Preview my profile</Link>
                        </div>
                        <button type="submit" disabled={form.processing} className="btn btn-gold">Save details</button>
                    </form>

                    <form onSubmit={(e) => { e.preventDefault(); pw.put('/account/password', { preserveScroll: true, onSuccess: () => pw.reset() }); }} className="card h-fit space-y-5 p-6 sm:p-8">
                        <h2 className="font-display text-2xl">Change password</h2>
                        <Input label="Current password" type="password" autoComplete="current-password" value={pw.data.current_password} onChange={(e) => pw.setData('current_password', e.target.value)} error={pw.errors.current_password} />
                        <Input label="New password" type="password" autoComplete="new-password" value={pw.data.password} onChange={(e) => pw.setData('password', e.target.value)} error={pw.errors.password} />
                        <Input label="Repeat new password" type="password" autoComplete="new-password" value={pw.data.password_confirmation} onChange={(e) => pw.setData('password_confirmation', e.target.value)} />
                        <button type="submit" disabled={pw.processing} className="btn btn-ghost">Change password</button>
                    </form>
                </div>
                <YourData />
            </section>
        </SiteLayout>
    );
}
