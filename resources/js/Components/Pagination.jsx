import { Link } from '@inertiajs/react';

export default function Pagination({ links }) {
    if (!links || links.length <= 3) return null;
    return (
        <nav className="mt-8 flex flex-wrap justify-center gap-1.5" aria-label="Pagination">
            {links.map((l, i) => {
                const label = l.label.replace('&laquo;', '‹').replace('&raquo;', '›').replace(' Previous', '').replace('Next ', '');
                return l.url ? (
                    <Link
                        key={i}
                        href={l.url}
                        preserveScroll
                        className={`num min-w-9 rounded-full px-3 py-1.5 text-center text-sm ${l.active ? 'bg-gold text-ink font-bold' : 'border border-line text-cream hover:border-gold'}`}
                    >
                        {label}
                    </Link>
                ) : (
                    <span key={i} className="min-w-9 rounded-full px-3 py-1.5 text-center text-sm text-mist/50">
                        {label}
                    </span>
                );
            })}
        </nav>
    );
}
