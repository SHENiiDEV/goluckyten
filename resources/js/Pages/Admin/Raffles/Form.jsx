import { useEffect, useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { Checkbox, Input, Select, Textarea } from '../../../Components/Form';
import PrizeArt from '../../../Components/PrizeArt';

const cents = (v) => (v === null || v === undefined ? '' : (v / 100).toFixed(2));

export default function Form({ raffle, categories, ticketDefaults }) {
    const editing = !!raffle;
    const defaultDraw = new Date(Date.now() + 7 * 864e5);
    defaultDraw.setHours(20, 0, 0, 0);
    const local = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);

    const { data, setData, post, processing, errors, progress } = useForm({
        title: raffle?.title ?? '',
        brand: raffle?.brand ?? '',
        promo_label: raffle?.promo_label ?? '',
        headline: raffle?.headline ?? '',
        gallery: [],
        remove_gallery: [],
        video: null,
        remove_video: false,
        subtitle: raffle?.subtitle ?? '',
        description: raffle?.description ?? '',
        highlights: raffle?.highlights ?? '',
        category: raffle?.category ?? categories[0].key,
        retail_value: cents(raffle?.retail_value_cents),
        cash_alternative: cents(raffle?.cash_alternative_cents),
        ticket_price: cents(raffle?.ticket_price_cents ?? ticketDefaults.price_cents),
        max_tickets: raffle?.max_tickets ?? '',
        max_per_user: raffle?.max_per_user ?? 100,
        free_entry_enabled: raffle?.free_entry_enabled ?? true,
        featured: raffle?.featured ?? false,
        status: raffle?.status ?? 'draft',
        draws_at: raffle?.draws_at ?? local(defaultDraw),
        image: null,
        remove_image: false,
        sale_price: cents(raffle?.sale_price_cents),
        sale_ends_at: raffle?.sale_ends_at ?? '',
        auto_draw: raffle?.auto_draw ?? true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(editing ? `/admin/raffles/${raffle.slug}` : '/admin/raffles', { forceFormData: true });
    };
    const bind = (k) => ({ value: data[k], onChange: (e) => setData(k, e.target.value), error: errors[k] });

    // Ticket pool = prize value × multiplier ÷ ticket price (€100 → 10,000 tickets at €0.10).
    const suggested = (() => {
        const value = parseFloat(data.retail_value);
        const price = parseFloat(data.ticket_price);
        if (!value || !price) return null;
        return Math.ceil((value * ticketDefaults.multiplier) / price);
    })();
    const [autoTickets, setAutoTickets] = useState(!raffle);
    useEffect(() => {
        if (autoTickets && suggested) setData('max_tickets', suggested);
    }, [suggested, autoTickets]);
    const preview = data.image ? URL.createObjectURL(data.image) : data.remove_image ? null : raffle?.image_url;

    return (
        <AdminLayout title={editing ? `Edit ${raffle.title}` : 'New raffle'} actions={editing && <Link href={`/admin/raffles/${raffle.slug}`} className="btn btn-ghost btn-sm">Back to raffle</Link>}>
            <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_320px]">
                <div className="card space-y-5 p-6">
                    <div className="grid gap-5 sm:grid-cols-[1fr_2fr]">
                        <Input label="Brand" placeholder="Porsche" {...bind('brand')} />
                        <Input label="Title" {...bind('title')} />
                    </div>
                    <Input label="Subtitle" {...bind('subtitle')} hint="One line shown under the title." />
                    <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
                        <Input label="Banner headline" placeholder="Win a Porsche 911 for €19.99" {...bind('headline')} hint="Big text on the home page slide." />
                        <Input label="Promo label" placeholder="Jackpot" {...bind('promo_label')} hint="Strip on the photo. Empty = automatic." />
                    </div>
                    <Textarea label="Description" rows={7} {...bind('description')} hint="Separate paragraphs with a blank line." />
                    <Textarea label="Highlights" rows={4} {...bind('highlights')} hint="One per line." />
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Select label="Category" {...bind('category')}>
                            {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                        </Select>
                        <Input label="Draw date and time" type="datetime-local" {...bind('draws_at')} />
                        <Input label="Prize value (€)" type="number" step="0.01" min="1" {...bind('retail_value')} />
                        <Input label="Cash alternative (€)" type="number" step="0.01" min="0" {...bind('cash_alternative')} hint="Leave empty if there is none." />
                        <Input label="Ticket price (€)" type="number" step="0.01" min="0.01" {...bind('ticket_price')} />
                        <div>
                            <Input
                                label="Maximum tickets"
                                type="number"
                                min="1"
                                value={data.max_tickets}
                                onChange={(e) => { setAutoTickets(false); setData('max_tickets', e.target.value); }}
                                error={errors.max_tickets}
                                hint={editing ? `${raffle.tickets_sold.toLocaleString('en-GB')} already issued. Includes free entries.` : 'Includes free entries.'}
                            />
                            {suggested && Number(data.max_tickets) !== suggested && (
                                <button type="button" onClick={() => { setAutoTickets(true); setData('max_tickets', suggested); }} className="mt-1.5 text-xs font-semibold text-violet-hi underline underline-offset-2">
                                    Use {suggested.toLocaleString('en-GB')} (value × {ticketDefaults.multiplier} ÷ price)
                                </button>
                            )}
                        </div>
                        <Input label="Limit per person" type="number" min="1" {...bind('max_per_user')} />
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="card space-y-4 p-6">
                        <Select label="Status" {...bind('status')}>
                            {raffle?.status === 'drawn' ? (
                                <option value="drawn">Drawn</option>
                            ) : (
                                <>
                                    <option value="draft">Draft (hidden)</option>
                                    <option value="live">Live</option>
                                    <option value="closed">Closed</option>
                                </>
                            )}
                        </Select>
                        <Checkbox checked={data.free_entry_enabled} onChange={(e) => setData('free_entry_enabled', e.target.checked)}>Accept free entries</Checkbox>
                        <Checkbox checked={data.featured} onChange={(e) => setData('featured', e.target.checked)}>Feature on the home page</Checkbox>
                        <Checkbox checked={data.auto_draw} onChange={(e) => setData('auto_draw', e.target.checked)}>Draw automatically at the draw time (provably fair, shown live)</Checkbox>
                    </div>
                    <div className="card space-y-4 p-6">
                        <p className="text-sm font-semibold">Flash sale</p>
                        <Input label="Sale ticket price (€)" type="number" step="0.01" min="0.01" {...bind('sale_price')} hint="Leave empty for no sale." />
                        <Input label="Sale ends" type="datetime-local" {...bind('sale_ends_at')} />
                        <p className="text-xs text-mist">Cards show the old price crossed out with a “Flash sale” strip until it ends.</p>
                    </div>
                    <div className="card space-y-4 p-6">
                        <p className="text-sm font-semibold">Prize image</p>
                        <div className="aspect-[4/3] overflow-hidden rounded-xl border border-line">
                            <PrizeArt category={data.category} imageUrl={preview} />
                        </div>
                        <input type="file" accept="image/*" onChange={(e) => setData('image', e.target.files[0] ?? null)} className="block w-full text-sm text-mist file:mr-3 file:rounded-full file:border-0 file:bg-panel-2 file:px-4 file:py-2 file:text-cream" />
                        {errors.image && <p className="text-xs text-ruby">{errors.image}</p>}
                        {progress && <p className="num text-xs text-mist">Uploading {progress.percentage}%</p>}
                        {raffle?.image_url && !data.image && (
                            <Checkbox checked={data.remove_image} onChange={(e) => setData('remove_image', e.target.checked)}>Remove image and use the illustration</Checkbox>
                        )}
                        <p className="text-xs text-mist">Without an image, a gold illustration for the category is shown.</p>
                    </div>
                    <div className="card space-y-4 p-6">
                        <p className="text-sm font-semibold">Gallery</p>
                        {raffle?.gallery?.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                                {raffle.gallery.map((g) => {
                                    const removed = data.remove_gallery.includes(g.path);
                                    return (
                                        <button
                                            type="button"
                                            key={g.path}
                                            onClick={() => setData('remove_gallery', removed ? data.remove_gallery.filter((p) => p !== g.path) : [...data.remove_gallery, g.path])}
                                            className={`relative aspect-square overflow-hidden rounded-lg border ${removed ? 'border-ruby opacity-40' : 'border-line'}`}
                                            title={removed ? 'Keep' : 'Remove'}
                                        >
                                            <img src={g.url} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                            {removed && <span className="absolute inset-0 grid place-items-center text-xs text-ruby">removed</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        <input type="file" accept="image/*" multiple onChange={(e) => setData('gallery', Array.from(e.target.files))} className="block w-full text-sm text-mist file:mr-3 file:rounded-full file:border-0 file:bg-panel-2 file:px-4 file:py-2 file:text-cream" />
                        {errors['gallery.0'] && <p className="text-xs text-ruby">{errors['gallery.0']}</p>}
                        <p className="text-sm font-semibold">Video</p>
                        {raffle?.video_url && !data.video && (
                            <Checkbox checked={data.remove_video} onChange={(e) => setData('remove_video', e.target.checked)}>Remove current video</Checkbox>
                        )}
                        <input type="file" accept="video/mp4,video/webm" onChange={(e) => setData('video', e.target.files[0] ?? null)} className="block w-full text-sm text-mist file:mr-3 file:rounded-full file:border-0 file:bg-panel-2 file:px-4 file:py-2 file:text-cream" />
                        {errors.video && <p className="text-xs text-ruby">{errors.video}</p>}
                        <p className="text-xs text-mist">MP4 or WebM, up to 50 MB. Shown first in the gallery, muted and looping.</p>
                    </div>
                    <button type="submit" disabled={processing} className="btn btn-gold w-full">{editing ? 'Save changes' : 'Create raffle'}</button>
                </div>
            </form>
        </AdminLayout>
    );
}
