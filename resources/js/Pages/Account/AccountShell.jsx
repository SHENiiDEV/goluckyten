import { Head } from '@inertiajs/react';
import SiteLayout from '../../Layouts/SiteLayout';
import AccountNav from './AccountNav';

export default function AccountShell({ title, intro, children, width = 'max-w-6xl' }) {
    return (
        <SiteLayout newsletter={false}>
            <Head title={title} />
            <section className={`mx-auto ${width} px-4 pt-12 sm:px-6 lg:px-8`}>
                <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
                {intro && <p className="mt-2 max-w-2xl text-cream/75">{intro}</p>}
                <AccountNav />
                <div className="mt-10">{children}</div>
            </section>
        </SiteLayout>
    );
}
