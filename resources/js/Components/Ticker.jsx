import { Link } from '@inertiajs/react';

export default function Ticker({ items }) {
    if (!items?.length) return null;
    const row = [...items, ...items];
    return (
        <div className="ticker overflow-hidden bg-gradient-to-r from-violet-deep via-violet to-[#c04cf0] text-white" aria-label="Latest news">
            <div className="ticker-track flex w-max gap-10 whitespace-nowrap py-2 text-[13px] font-semibold" style={{ animationDuration: `${Math.max(40, items.length * 6)}s` }}>
                {row.map((t, i) => (
                    <Link key={i} href={t.href} className="inline-flex items-center gap-2 hover:underline" tabIndex={i >= items.length ? -1 : 0} aria-hidden={i >= items.length}>
                        <span aria-hidden="true">{t.icon}</span>
                        {t.text}
                    </Link>
                ))}
            </div>
        </div>
    );
}
