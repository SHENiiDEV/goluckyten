import { Link, usePage } from '@inertiajs/react';

export default function AccountNav() {
    const { url, props } = usePage();
    const items = [
        ['/account', 'My tickets'],
        ['/free-entry', 'Free entries'],
        ['/account/wallet', 'Wallet'],
        ['/account/referrals', 'Invite friends'],
        ['/account/notifications', 'Notifications'],
        ['/account/safer-play', 'Safer play'],
        ['/account/profile', 'Profile'],
        [`/players/${props.auth.user.public_id}`, 'Public profile'],
    ];
    return (
        <nav className="no-scrollbar mt-8 flex gap-2 overflow-x-auto border-b border-line" aria-label="Account">
            {items.map(([href, label]) => {
                const active = href === '/account' ? url === '/account' || url.startsWith('/account/orders') : url.startsWith(href);
                return (
                    <Link key={href} href={href} className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 pb-3 text-sm ${active ? 'border-gold text-gold-hi' : 'border-transparent text-cream/75 hover:text-cream'}`}>
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}
