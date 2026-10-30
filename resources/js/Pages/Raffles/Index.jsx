import { Head, router } from '@inertiajs/react';
import SiteLayout from '../../Layouts/SiteLayout';
import RaffleCard from '../../Components/RaffleCard';

const sorts = [
    ['ending', 'Closing soonest'],
    ['value', 'Biggest prize'],
    ['price', 'Cheapest tickets'],
    ['newest', 'Newest'],
];

export default function Index({ raffles, categories, filters }) {
    const go = (next) => router.get('/raffles', { ...filters, ...next }, { preserveState: true, preserveScroll: true, replace: true });
    const active = filters.tab === 'instant' ? 'instant' : filters.category ?? 'all';
    const chip = (key, label, next) => (
        <button
            key={key}
            onClick={() => go(next)}
            className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold ${active === key ? 'bg-violet text-white' : 'text-cream/80 hover:bg-panel hover:text-white'}`}
        >
            {label}
        </button>
    );
    const title = filters.tab === 'instant' ? 'Instant win competitions' : filters.category ? categories.find((c) => c.key === filters.category)?.label ?? 'Competitions' : 'All competitions';

    return (
        <SiteLayout>
            <Head title={title} />
            <section className="border-b border-line bg-gradient-to-b from-violet-deep/20 to-transparent">
                <div className="mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:px-8">
                    <h1 className="font-wide text-4xl sm:text-5xl">{title}</h1>
                    <p className="mt-3 max-w-xl text-cream/75">{raffles.length} live now. Every competition shows its ticket limit and draw time, and every one can be entered for free.</p>
                    <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="no-scrollbar -mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
                            <div className="inline-flex gap-1 rounded-xl border border-line bg-ink-2 p-1">
                                {chip('all', 'All', { category: null, tab: null })}
                                {chip('instant', 'Instant wins', { category: null, tab: 'instant' })}
                                {categories.map((c) => chip(c.key, c.label, { category: c.key, tab: null }))}
                            </div>
                        </div>
                        <label className="flex items-center gap-3 text-sm text-mist">
                            Sort
                            <select className="field w-auto py-2" value={filters.sort} onChange={(e) => go({ sort: e.target.value })}>
                                {sorts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </label>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
                {raffles.length ? (
                    <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
                        {raffles.map((r) => <RaffleCard key={r.id} raffle={r} />)}
                    </div>
                ) : (
                    <div className="card p-12 text-center">
                        <p className="font-display text-2xl">Nothing live here right now</p>
                        <p className="mt-2 text-mist">New competitions open every week.</p>
                        <button onClick={() => go({ category: null, tab: null })} className="btn btn-primary mt-6">Show all competitions</button>
                    </div>
                )}
            </section>
        </SiteLayout>
    );
}
