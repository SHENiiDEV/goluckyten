import { Link, router } from '@inertiajs/react';

/**
 * A player's public name; links to their profile only if they made it public.
 * Inside another link (cards, feed rows) pass `nested` so we don't render <a> inside <a>.
 */
export default function PlayerName({ name, id, className = 'font-bold', nested = false }) {
    if (!id) return <span className={className}>{name}</span>;
    const cls = `${className} cursor-pointer underline decoration-violet-hi/40 underline-offset-2 hover:text-violet-hi hover:decoration-violet-hi`;
    if (!nested) {
        return <Link href={`/players/${id}`} className={cls}>{name}</Link>;
    }
    const go = (e) => {
        e.preventDefault();
        e.stopPropagation();
        router.visit(`/players/${id}`);
    };
    return (
        <span role="link" tabIndex={0} className={cls} onClick={go} onKeyDown={(e) => e.key === 'Enter' && go(e)}>
            {name}
        </span>
    );
}
