import { router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Checkbox, Input, Select } from '../../Components/Form';
import { money } from '../../lib/format';

const blank = { code: '', type: 'percent', value: '10', min_spend: '', max_uses: '', per_user_limit: 1, starts_at: '', ends_at: '', active: true };

function CodeForm({ initial, onDone }) {
    const form = useForm(initial);
    const bind = (k) => ({ value: form.data[k] ?? '', onChange: (e) => form.setData(k, e.target.value), error: form.errors[k] });
    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: () => { form.reset(); onDone?.(); } };
        initial.id ? form.put(`/admin/promo-codes/${initial.id}`, opts) : form.post('/admin/promo-codes', opts);
    };
    return (
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-4">
            <Input label="Code" className="sm:col-span-2" placeholder="WELCOME10" {...bind('code')} />
            <Select label="Type" {...bind('type')}>
                <option value="percent">% off</option>
                <option value="fixed">€ off</option>
            </Select>
            <Input label={form.data.type === 'percent' ? 'Percent' : 'Amount (€)'} type="number" step="0.01" min="0.01" {...bind('value')} />
            <Input label="Minimum spend (€)" type="number" step="0.01" min="0" {...bind('min_spend')} />
            <Input label="Total uses" type="number" min="1" placeholder="Unlimited" {...bind('max_uses')} />
            <Input label="Uses per player" type="number" min="1" {...bind('per_user_limit')} />
            <div className="flex items-end pb-2"><Checkbox checked={!!form.data.active} onChange={(e) => form.setData('active', e.target.checked)}>Active</Checkbox></div>
            <Input label="Starts" type="datetime-local" className="sm:col-span-2" {...bind('starts_at')} />
            <Input label="Ends" type="datetime-local" className="sm:col-span-2" {...bind('ends_at')} />
            <div className="flex gap-2 sm:col-span-4">
                <button disabled={form.processing} className="btn btn-primary btn-sm">{initial.id ? 'Save' : 'Create code'}</button>
                {onDone && initial.id && <button type="button" onClick={onDone} className="btn btn-ghost btn-sm">Cancel</button>}
            </div>
        </form>
    );
}

export default function PromoCodes({ codes }) {
    const cur = usePage().props.app.currency;
    const [editing, setEditing] = useState(null);

    return (
        <AdminLayout title="Promo codes">
            <div className="card p-6">
                <h2 className="mb-4 font-display text-xl">New code</h2>
                <CodeForm initial={blank} />
            </div>
            <div className="mt-8 space-y-3">
                {codes.length === 0 && <p className="text-mist">No codes yet.</p>}
                {codes.map((c) => (
                    <div key={c.id} className="card p-5">
                        {editing === c.id ? (
                            <CodeForm
                                initial={{ ...c, value: c.type === 'percent' ? c.value : (c.value / 100).toFixed(2), min_spend: c.min_spend_cents ? (c.min_spend_cents / 100).toFixed(2) : '', max_uses: c.max_uses ?? '', starts_at: c.starts_at ?? '', ends_at: c.ends_at ?? '' }}
                                onDone={() => setEditing(null)}
                            />
                        ) : (
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="font-mono text-lg font-bold">{c.code}</span>
                                <span className="rounded-full bg-violet/15 px-2.5 py-0.5 text-sm font-semibold text-violet-hi">{c.label}</span>
                                {!c.active && <span className="rounded-full bg-line px-2.5 py-0.5 text-xs text-mist">Inactive</span>}
                                <span className="text-sm text-mist">
                                    {c.uses_count}{c.max_uses ? ` / ${c.max_uses}` : ''} uses · {money(c.discount_total_cents, cur)} given
                                    {c.min_spend_cents > 0 && ` · min ${money(c.min_spend_cents, cur)}`}
                                    {c.ends_at && ` · ends ${c.ends_at.replace('T', ' ')}`}
                                </span>
                                <div className="ml-auto flex gap-2">
                                    <button onClick={() => setEditing(c.id)} className="btn btn-ghost btn-sm">Edit</button>
                                    <button onClick={() => router.delete(`/admin/promo-codes/${c.id}`, { preserveScroll: true })} className="btn btn-ghost btn-sm">{c.uses_count ? 'Deactivate' : 'Delete'}</button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </AdminLayout>
    );
}
