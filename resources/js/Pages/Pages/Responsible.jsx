import { Link, usePage } from '@inertiajs/react';
import LegalShell, { InShort, Section } from './LegalShell';

const signs = [
    'Spending more than you planned, or more than you can afford',
    'Chasing losses or buying “one more” to make up for it',
    'Borrowing money or using bill money to play',
    'Feeling anxious, irritable or secretive about playing',
    'Playing to escape problems or low mood',
];

export default function Responsible({ updated }) {
    const { company, auth } = usePage().props;
    const tools = auth.user ? '/account/safer-play' : '/login';
    return (
        <LegalShell
            title="Responsible play"
            eyebrow="Safer play"
            updated={updated}
            icon="🧭"
            intro="Competitions should be a bit of fun, never a way to make money. Here are the tools we give you, and where to get help."
            glance={[
                ['💶', 'Spend limits', 'Daily, weekly or monthly. Tighten instantly; loosening waits 24 hours.'],
                ['⏱', 'Reality checks', 'A pop-up after 15 minutes to 2 hours, your choice.'],
                ['⏸', 'Take a break', 'Block yourself for 24 hours up to 5 years. It can’t be undone early.'],
                ['✉️', 'Free entry', 'Every competition can be entered without paying.'],
            ]}
        >
            <Section id="proportion" title="Keep it in proportion">
                <ul>
                    <li>Decide a budget before you buy, and treat it as the cost of entertainment.</li>
                    <li>Never chase losses or borrow money to play.</li>
                    <li>Take breaks. There is always another draw.</li>
                    <li>Don’t play when you’re upset, stressed or have been drinking.</li>
                </ul>
            </Section>
            <Section id="tools" title="Your tools">
                <InShort>All of these are in your account under Safer play, and work immediately.</InShort>
                <ol>
                    <li><strong>Spend limit.</strong> Caps what you can pay for tickets per day, week or month, including wallet money.</li>
                    <li><strong>Reality check.</strong> Shows how long you’ve been on the site at an interval you pick.</li>
                    <li><strong>Break (self-exclusion).</strong> Stops all paid and free entries for 24 hours, 1 week, 1 month, 6 months, 1 year or 5 years. You can still see your tickets and withdraw.</li>
                    <li><strong>Close your account.</strong> From Profile → Your data, at any time.</li>
                    <li><strong>Per-competition limits.</strong> Every competition caps how many tickets one person can hold.</li>
                </ol>
                <Link href={tools} className="btn btn-primary btn-sm mt-3">{auth.user ? 'Open Safer play' : 'Sign in to set limits'}</Link>
            </Section>
            <Section id="signs" title="Warning signs">
                <p>It might be time to stop, or talk to someone, if any of these sound familiar:</p>
                <ul>{signs.map((s) => <li key={s}>{s}</li>)}</ul>
            </Section>
            <Section id="help" title="Getting help">
                <p>Free, confidential support, any time:</p>
                <ul>
                    <li><a href="https://www.gamcare.org.uk" target="_blank" rel="noreferrer">GamCare</a>: National Gambling Helpline 0808 8020 133, 24/7, with live chat.</li>
                    <li><a href="https://www.begambleaware.org" target="_blank" rel="noreferrer">BeGambleAware</a>: advice, self-assessment and local treatment.</li>
                    <li><a href="https://www.gamblingtherapy.org" target="_blank" rel="noreferrer">Gambling Therapy</a>: international support in many languages.</li>
                    <li><a href="https://www.gamstop.co.uk" target="_blank" rel="noreferrer">GAMSTOP</a>: free self-exclusion from many UK gambling sites at once.</li>
                </ul>
                <p>You can also email <a href={`mailto:${company.email}`}>{company.email}</a> and a person on our team will help with limits or closing your account within 24 hours.</p>
            </Section>
            <Section id="minors" title="Protecting under-18s">
                <p>You must be 18 or over to play. We check age at registration and before paying any prize. If you share a device with children, consider parental-control software such as Net Nanny or Qustodio.</p>
            </Section>
        </LegalShell>
    );
}
