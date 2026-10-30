import { Head } from '@inertiajs/react';
import SiteLayout from '../../Layouts/SiteLayout';

export default function AuthShell({ title, heading, intro, children, wide = false }) {
    return (
        <SiteLayout>
            <Head title={title} />
            <section className={`mx-auto px-4 pt-12 sm:px-6 ${wide ? 'max-w-3xl' : 'max-w-md'}`}>
                <h1 className="font-display text-4xl sm:text-5xl">{heading}</h1>
                {intro && <p className="mt-3 text-cream/75">{intro}</p>}
                <div className="mt-8">{children}</div>
            </section>
        </SiteLayout>
    );
}
