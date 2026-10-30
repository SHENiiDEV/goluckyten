import { Head, Link, usePage } from '@inertiajs/react';
import SiteLayout from '../Layouts/SiteLayout';
import Media from '../Components/Media';
import Pagination from '../Components/Pagination';
import PlayerName from '../Components/PlayerName';
import { date, money, number } from '../lib/format';

export default function Winners({ winners, instantWins }) {
    const { app } = usePage().props;

    return (
        <SiteLayout>
            <Head title="Winners" />
            <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
                <h1 className="font-display text-5xl">Winners</h1>
                <p className="mt-3 max-w-xl text-cream/75">Every draw, with the winning ticket number and how many tickets were in it.</p>

                {winners.data.length === 0 ? (
                    <div className="card mt-10 p-12 text-center text-mist">The first draw hasn’t happened yet.</div>
                ) : (
                    <div className="mt-10 overflow-hidden rounded-2xl border border-line">
                        {winners.data.map((w) => (
                            <Link key={w.id} href={`/raffles/${w.slug}`} className="grid items-center gap-4 border-b border-line bg-panel/50 p-4 last:border-b-0 hover:bg-panel sm:grid-cols-[120px_1fr_auto] sm:gap-6">
                                <div className="aspect-[4/3] overflow-hidden rounded-lg"><Media src={w.image_url} category={w.category} title={w.title} /></div>
                                <div>
                                    <div className="font-display text-xl">{w.title}</div>
                                    <div className="mt-1 text-sm text-mist">
                                        Drawn {date(w.drawn_at)}, {number(w.tickets_sold)} tickets, worth {money(w.retail_value_cents, app.currency, { compact: true })}
                                    </div>
                                </div>
                                <div className="sm:text-right">
                                    <div className="font-display text-xl text-cream"><PlayerName name={w.winner_name} id={w.winner_player_id} className="" nested /></div>
                                    <div className="text-sm text-mist">{w.winner_city}</div>
                                    <div className="num mt-1 text-sm text-gold-hi">Ticket #{w.winner_number}{w.winner_entry === 'free' ? ' (free entry)' : ''}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
                <Pagination links={winners.links} />

                {instantWins.length > 0 && (
                    <>
                        <h2 className="mt-20 font-display text-3xl">Latest instant wins</h2>
                        <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
                            <table className="w-full min-w-[640px] text-sm">
                                <thead className="bg-panel text-left text-xs text-mist">
                                    <tr><th className="px-4 py-3 font-medium">Winner</th><th className="px-4 py-3 font-medium">Prize</th><th className="px-4 py-3 font-medium">Raffle</th><th className="px-4 py-3 font-medium">Ticket</th><th className="px-4 py-3 font-medium">Won</th></tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {instantWins.map((w) => (
                                        <tr key={w.id} className="bg-panel/40">
                                            <td className="px-4 py-3"><PlayerName name={w.name} id={w.player_id} className="" /><div className="text-xs text-mist">{w.city}</div></td>
                                            <td className="px-4 py-3 font-semibold text-gold-hi">{w.title}</td>
                                            <td className="px-4 py-3"><Link href={`/raffles/${w.raffle_slug}`} className="hover:text-gold-hi">{w.raffle}</Link></td>
                                            <td className="num px-4 py-3">#{w.number}</td>
                                            <td className="num px-4 py-3 text-cream/75">{date(w.won_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </section>
        </SiteLayout>
    );
}
