import { Head, Link } from '@inertiajs/react';
import SiteLayout from '../../Layouts/SiteLayout';

const steps = [
    ['Pick a prize', 'Every raffle shows the maximum number of tickets, the price and the exact draw time, so you can see your odds before you play.'],
    ['Get your tickets', 'Buy as many tickets as you like up to the per-person limit, or request one free entry. Ticket numbers are assigned at random.'],
    ['Watch the draw', 'At the draw time, one ticket is chosen at random from every ticket issued — paid and free together.'],
    ['Collect your prize', 'We contact the winner within 48 hours, verify their details and arrange delivery or the cash alternative.'],
];

const faq = [
    ['Do I have to pay to enter?', 'No. Every raffle marked “Free entry available” can be entered for free once per person. Free entries have exactly the same chance as paid ones.'],
    ['How are winners chosen?', 'With a cryptographically secure random number generator, across all tickets issued for that raffle.'],
    ['What are my odds?', 'Your tickets divided by the tickets issued. The maximum is always shown, so your odds can only be better than tickets ÷ maximum.'],
    ['What is an instant win?', 'Some raffles hide cash and prizes behind ticket numbers chosen in secret before sales open. If you’re issued one of those numbers, you win straight away — and your ticket still goes into the main draw.'],
    ['What if a raffle doesn’t sell out?', 'The draw still happens at the published time with the tickets that were issued.'],
    ['Can I take cash instead?', 'Where a cash alternative is listed on the raffle page, yes — the winner chooses.'],
    ['Who can play?', 'Anyone aged 18 or over who lives in a country where taking part is allowed. Some countries are excluded; see our Terms.'],
];

export default function HowItWorks() {
    return (
        <SiteLayout>
            <Head title="How it works" />
            <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
                <h1 className="font-display text-5xl">How it works</h1>
                <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
                    {steps.map(([t, d], i) => (
                        <li key={t} className="bg-panel p-6">
                            <span className="num font-display text-4xl text-gold-deep">{i + 1}</span>
                            <h2 className="mt-4 font-display text-xl">{t}</h2>
                            <p className="mt-2 text-sm leading-relaxed text-cream/75">{d}</p>
                        </li>
                    ))}
                </ol>

                <h2 className="mt-20 font-display text-3xl">Questions</h2>
                <div className="mt-6 divide-y divide-line rounded-2xl border border-line">
                    {faq.map(([q, a]) => (
                        <details key={q} className="faq group px-6 py-5">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                                {q}
                                <span className="text-gold transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                            </summary>
                            <p className="mt-3 max-w-2xl text-cream/75">{a}</p>
                        </details>
                    ))}
                </div>
                <div className="mt-12 flex flex-wrap gap-3">
                    <Link href="/raffles" className="btn btn-gold">See live raffles</Link>
                    <Link href="/free-entry" className="btn btn-jade">Enter for free</Link>
                </div>
            </section>
        </SiteLayout>
    );
}
