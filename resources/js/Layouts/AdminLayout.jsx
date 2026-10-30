import { Head, Link, usePage } from '@inertiajs/react';
import Logo from '../Components/Logo';
import Flash from '../Components/Flash';

const items = [
    ['/admin', 'Overview'],
    ['/admin/raffles', 'Raffles'],
    ['/admin/instant-wins', 'Instant wins'],
    ['/admin/free-entries', 'Free entries'],
    ['/admin/orders', 'Orders'],
    ['/admin/promo-codes', 'Promo codes'],
    ['/admin/withdrawals', 'Withdrawals'],
    ['/admin/users', 'Players'],
];

export default function AdminLayout({ title, actions, children }) {
    const { url, props } = usePage();
    const active = (href) => (href === '/admin' ? url === '/admin' : url.startsWith(href));

    return (
        <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
            <Head title={title ? `${title} · Admin` : 'Admin'} />
            <aside className="border-b border-line bg-ink-2/80 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
                <div className="flex items-center justify-between px-5 py-5">
                    <Logo />
                </div>
                <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0" aria-label="Admin">
                    {items.map(([href, label]) => (
                        <Link key={href} href={href} className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-sm ${active(href) ? 'bg-panel-2 text-gold-hi' : 'text-cream/80 hover:bg-panel'}`}>
                            {label}
                        </Link>
                    ))}
                    <div className="hidden lg:mt-6 lg:block lg:border-t lg:border-line lg:pt-4">
                        <Link href="/" className="block rounded-xl px-3 py-2.5 text-sm text-mist hover:text-cream">View site</Link>
                        <Link href="/logout" method="post" as="button" className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-mist hover:text-cream">
                            Sign out {props.auth.user?.name}
                        </Link>
                    </div>
                </nav>
            </aside>
            <div className="min-w-0">
                <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
                    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                        <h1 className="font-display text-3xl">{title}</h1>
                        {actions}
                    </div>
                    {children}
                </div>
            </div>
            <Flash />
        </div>
    );
}
