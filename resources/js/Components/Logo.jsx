import { Link } from '@inertiajs/react';

export default function Logo({ className = '', size = 'md' }) {
    const h = size === 'sm' ? 'h-7' : 'h-8 lg:h-9';
    return (
        <Link href="/" className={`inline-flex shrink-0 items-center ${className}`} aria-label="GoLuckyTen home">
            <picture>
                <source srcSet="/images/brand/logo-h96.webp" type="image/webp" />
                <img src="/images/brand/logo-h96.png" alt="GoLuckyTen" className={`${h} w-auto`} width="553" height="96" />
            </picture>
        </Link>
    );
}
