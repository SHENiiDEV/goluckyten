import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import SiteLayout from '../../Layouts/SiteLayout';

const pages = [
    ['/terms', 'Terms & Conditions', 'The rules for every competition, free entry and prizes.', '📜'],
    ['/privacy', 'Privacy Policy', 'What we collect, why, and your rights.', '🔒'],
    ['/cookies', 'Cookie Policy', 'The cookies we use and how to control them.', '🍪'],
    ['/responsible-play', 'Responsible play', 'Limits, breaks and where to get help.', '🧭'],
];

/** A numbered card section. The shell builds the contents list from these. */
export function Section({ id, title, children }) {
    return (
        <section id={id} data-legal-section data-title={title} className="legal-section legal-card rounded-[22px] border border-line bg-panel/70 p-6 sm:p-8">
            <h2 className="flex items-baseline gap-3 font-wide text-xl text-white sm:text-2xl">
                <span data-legal-num className="num shrink-0 text-base font-bold text-violet-hi" />
                <span>{title}</span>
            </h2>
            <div className="prose-legal mt-4">{children}</div>
        </section>
    );
}

/** A plain-English summary box inside a section. */
export function InShort({ children }) {
    return (
        <p className="!mt-0 mb-4 rounded-xl border border-violet/25 bg-violet/[0.07] px-4 py-3 text-sm !text-cream">
            <strong className="mr-1.5 text-violet-hi">In short:</strong>
            {children}
        </p>
    );
}

export default function LegalShell({ title, eyebrow = 'Legal', updated, intro, icon = '📜', glance = [], children }) {
    const body = useRef(null);
    const [toc, setToc] = useState([]);
    const [active, setActive] = useState(null);
    const [minutes, setMinutes] = useState(null);

    useEffect(() => {
        const sections = [...body.current.querySelectorAll('[data-legal-section]')];
        sections.forEach((s, i) => {
            const n = s.querySelector('[data-legal-num]');
            if (n) n.textContent = String(i + 1).padStart(2, '0');
        });
        setToc(sections.map((s, i) => [s.id, s.dataset.title, i + 1]));
        setMinutes(Math.max(1, Math.round(body.current.innerText.split(/\s+/).length / 230)));

        const io = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActive(visible[0].target.id);
            },
            { rootMargin: '-110px 0px -60% 0px' },
        );
        sections.forEach((s) => io.observe(s));
        return () => io.disconnect();
    }, []);

    return (
        <SiteLayout>
            <Head title={title} />
            <section className="relative overflow-hidden border-b border-line">
                <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-violet/25 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 right-0 h-[24rem] w-[36rem] rounded-full bg-[#ff3d9a]/10 blur-3xl" />
                <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
                    <nav className="text-sm text-mist" aria-label="Breadcrumb">
                        <Link href="/" className="hover:text-white">Home</Link><span className="mx-2">/</span><span>{eyebrow}</span>
                    </nav>
                    <div className="mt-6 flex items-start gap-5">
                        <span className="hidden h-16 w-16 shrink-0 place-items-center rounded-2xl border border-line-2 bg-panel-2 text-3xl sm:grid" aria-hidden="true">{icon}</span>
                        <div>
                            <h1 className="font-wide text-4xl leading-[1.05] sm:text-6xl">{title}</h1>
                            {intro && <p className="mt-4 max-w-2xl text-lg text-cream/80">{intro}</p>}
                            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
                                {updated && <span className="rounded-full border border-line-2 bg-ink-2/70 px-3 py-1 text-cream/85">Updated {updated}</span>}
                                {minutes && <span className="rounded-full border border-line-2 bg-ink-2/70 px-3 py-1 text-cream/85">{minutes} min read</span>}
                                <button onClick={() => window.print()} className="no-print rounded-full border border-line-2 px-3 py-1 text-cream/85 hover:border-violet hover:text-white">Print or save as PDF</button>
                            </div>
                        </div>
                    </div>
                    {glance.length > 0 && (
                        <div className="stagger mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {glance.map(([ic, head, text]) => (
                                <div key={head} className="legal-card rounded-2xl border border-line bg-ink-2/70 p-4 backdrop-blur">
                                    <span className="text-2xl" aria-hidden="true">{ic}</span>
                                    <p className="mt-2 font-bold text-white">{head}</p>
                                    <p className="mt-1 text-sm leading-relaxed text-mist">{text}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
                {toc.length > 0 && (
                    <details className="faq no-print mb-6 rounded-2xl border border-line bg-panel/60 lg:hidden">
                        <summary className="cursor-pointer list-none px-5 py-4 font-semibold">Contents · {toc.length} sections</summary>
                        <ol className="grid gap-1 px-5 pb-4 text-sm">
                            {toc.map(([id, label, n]) => (
                                <li key={id}><a href={`#${id}`} className="flex gap-3 py-1 text-cream/80 hover:text-white"><span className="num w-6 text-violet-hi">{String(n).padStart(2, '0')}</span>{label}</a></li>
                            ))}
                        </ol>
                    </details>
                )}
                <div className="grid gap-10 lg:grid-cols-[250px_1fr]">
                    <nav className="no-print hidden lg:block" aria-label="On this page">
                        <div className="sticky top-28">
                            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-mist">On this page</p>
                            <ol className="space-y-0.5 text-sm">
                                {toc.map(([id, label, n]) => (
                                    <li key={id}>
                                        <a href={`#${id}`} data-active={active === id} className="toc-link flex gap-3 border-l-2 border-line py-1.5 pl-3 text-mist transition-colors duration-150 hover:text-white">
                                            <span className="num w-5 shrink-0 text-xs leading-5 text-violet-hi/80">{String(n).padStart(2, '0')}</span>
                                            <span>{label}</span>
                                        </a>
                                    </li>
                                ))}
                            </ol>
                            <a href="#main" className="mt-5 inline-block text-xs text-mist hover:text-white">↑ Back to top</a>
                        </div>
                    </nav>
                    <article ref={body} className="min-w-0 max-w-[76ch] space-y-5">{children}</article>
                </div>

                <div className="no-print mt-16">
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-mist">Related</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {pages.map(([href, label, text, ic]) => (
                            <Link key={href} href={href} className="pressable group rounded-2xl border border-line bg-panel/60 p-5 transition-colors duration-150 hover:border-violet">
                                <span className="text-2xl" aria-hidden="true">{ic}</span>
                                <p className="mt-2 font-bold text-white group-hover:text-violet-hi">{label} →</p>
                                <p className="mt-1 text-sm text-mist">{text}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </SiteLayout>
    );
}
