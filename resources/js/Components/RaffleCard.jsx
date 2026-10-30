import { Link, usePage } from '@inertiajs/react';
import Media from './Media';
import Progress from './Progress';
import { CountdownPill } from './Countdown';
import { money } from '../lib/format';

export default function RaffleCard({ raffle }) {
    const { app } = usePage().props;
    const cur = app.currency;
    const off = raffle.regular_price_cents ? Math.round((1 - raffle.ticket_price_cents / raffle.regular_price_cents) * 100) : 0;
    const strip = off > 0 ? `⚡ Flash sale: ${off}% off` : raffle.instant_left > 0 ? `${raffle.instant_left} instant wins left` : raffle.promo_label;

    return (
        <article className="group relative flex flex-col rounded-2xl border border-line bg-gradient-to-b from-panel-2 to-panel pt-3 transition-[border-color,scale] duration-200 ease-out hover:border-violet/60 active:scale-[0.99]">
            {raffle.is_open && (
                <div className="absolute inset-x-0 -top-3 z-10 flex justify-center">
                    <CountdownPill to={raffle.draws_at} />
                </div>
            )}
            <Link href={`/raffles/${raffle.slug}`} className="relative mx-3 block aspect-[4/3] overflow-hidden rounded-xl bg-ink-2" tabIndex={-1} aria-hidden="true">
                <Media src={raffle.image_url} category={raffle.category} title={raffle.title} className="transition-transform duration-300 ease-out group-hover:scale-[1.03]" />
                {strip && (
                    <div className="font-strip absolute inset-x-0 bottom-0 bg-violet/95 px-3 py-1.5 text-center text-[15px] leading-tight text-white">{strip}</div>
                )}
                {raffle.free_entry_enabled && raffle.is_open && (
                    <span className="absolute right-2 top-2 rounded-md bg-ink/75 px-2 py-0.5 text-[11px] font-semibold text-[#7fe5bf] backdrop-blur">Free entry</span>
                )}
            </Link>
            <div className="relative flex flex-1 flex-col px-4 pb-4 text-center">
                <div className="mb-2 mt-3 flex items-center justify-center gap-2">
                    <span className={`num rounded-full px-4 py-1.5 text-[15px] font-extrabold shadow-md ${raffle.regular_price_cents ? 'bg-hot text-white' : 'bg-white text-ink'}`}>{money(raffle.ticket_price_cents, cur)}</span>
                    {raffle.regular_price_cents && <span className="num text-sm text-mist line-through">{money(raffle.regular_price_cents, cur)}</span>}
                </div>
                <h3 className="text-[15px] font-bold leading-snug text-white">
                    <Link href={`/raffles/${raffle.slug}`} className="after:absolute after:inset-0 after:content-['']">{raffle.title}</Link>
                </h3>
                <p className="mt-1 text-xs text-mist">
                    {raffle.cash_alternative_cents ? `${money(raffle.cash_alternative_cents, cur, { compact: true })} cash alternative` : `Worth ${money(raffle.retail_value_cents, cur, { compact: true })}`}
                </p>
                <div className="mt-auto pt-4 text-left">
                    {raffle.is_open ? (
                        <Progress sold={raffle.tickets_sold} max={raffle.max_tickets} compact />
                    ) : (
                        <p className="text-sm text-mist">{raffle.status === 'drawn' ? 'Winner drawn' : 'Entries closed'}</p>
                    )}
                </div>
                <span className={`btn mt-3 w-full ${raffle.is_open ? 'btn-primary' : 'btn-ghost'}`} aria-hidden="true">
                    {raffle.is_open ? 'Enter now' : 'See result'}
                </span>
            </div>
        </article>
    );
}
