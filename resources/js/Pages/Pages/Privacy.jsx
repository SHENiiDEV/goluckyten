import { Link, usePage } from '@inertiajs/react';
import LegalShell, { InShort, Section } from './LegalShell';

export default function Privacy({ updated }) {
    const { company } = usePage().props;
    return (
        <LegalShell
            title="Privacy Policy"
            updated={updated}
            icon="🔒"
            intro="What personal data we collect when you use GoLuckyTen, why we need it, and what you can do about it."
            glance={[
                ['🚫', 'Never sold', 'We don’t sell your data or share it for other companies’ marketing.'],
                ['🙈', 'Private by default', 'Only your first name, initial and town appear if you win. Profiles are opt-in.'],
                ['⬇️', 'Download any time', 'Export everything we hold from your profile, in one click.'],
                ['🗑', 'Close any time', 'Delete your account yourself. We keep only what the law requires.'],
            ]}
        >
            <Section id="who" title="Who we are">
                <p>{company.name}, {company.address}, is the controller of your personal data. Contact: <a href={`mailto:${company.email}`}>{company.email}</a>.</p>
            </Section>

            <Section id="what" title="What we collect">
                <ul>
                    <li><strong>Account:</strong> email, password (stored only as a secure hash), name, surname, phone number, date of birth and postal address.</li>
                    <li><strong>Entries:</strong> orders, invoices, tickets (including numbers you chose), free entry requests and the messages you send with them.</li>
                    <li><strong>Wallet:</strong> credits, spending and withdrawals, and the account holder name and IBAN you give us for payouts.</li>
                    <li><strong>Settings:</strong> spend limits, breaks, reminder interval, favourite categories, notification choices and who referred you.</li>
                    <li><strong>Notifications:</strong> messages we’ve sent you and, if you switch on browser notifications, a push address for that browser.</li>
                    <li><strong>Technical:</strong> IP address, browser type, and the cookies described in our <Link href="/cookies">Cookie Policy</Link>.</li>
                </ul>
            </Section>

            <Section id="why" title="Why we use it">
                <ul>
                    <li>To run your account, issue tickets, send order confirmations and invoices, and pay withdrawals (performance of our contract with you).</li>
                    <li>To check your age and eligibility, verify winners, keep tax records, and apply spend limits and breaks you set (legal obligation and contract).</li>
                    <li>To prevent fraud, duplicate accounts and referral abuse (legitimate interests).</li>
                    <li>To publish winners’ first names, surname initials and towns, as described in our <Link href="/terms#draw">Terms</Link>.</li>
                    <li>To send draw reminders and new-competition alerts you asked for, which you can turn off in Notifications (consent).</li>
                    <li>Only if you switch it on: a public player profile with your first name, surname initial, city, competitions entered and wins (consent). Email, phone, address, date of birth and spending are never shown.</li>
                </ul>
            </Section>

            <Section id="sharing" title="Who we share it with">
                <p>Payment providers, our bank (for withdrawals), prize delivery partners, email, push and hosting providers, and authorities where the law requires it. We never sell your personal data.</p>
            </Section>

            <Section id="keep" title="How long we keep it">
                <InShort>While your account is open, then only what tax and draw records need.</InShort>
                <p>
                    For as long as your account is open. When you close it we remove your name, contact details, address, push subscriptions and notifications straight away.
                    Orders, invoices and tickets are kept for up to six years for tax, audit and draw-integrity purposes, without anything that identifies you.
                </p>
            </Section>

            <Section id="rights" title="Your rights">
                <p>You can access, correct, delete or export your data, restrict or object to its use, withdraw consent, and complain to your local data protection authority.</p>
                <ul>
                    <li><strong>Export:</strong> download a JSON copy from <Link href="/account/profile#your-data">Profile → Your data</Link>.</li>
                    <li><strong>Correct:</strong> edit your details in your profile; contact us to change your date of birth.</li>
                    <li><strong>Delete:</strong> close your account from the same page.</li>
                    <li>For anything else, email <a href={`mailto:${company.email}`}>{company.email}</a>. We reply within one month.</li>
                </ul>
            </Section>

            <Section id="cookies" title="Cookies">
                <p>We use essential cookies to keep you signed in, protect forms and remember your basket. Anything else only runs if you allow it in the cookie banner. Details in the <Link href="/cookies">Cookie Policy</Link>.</p>
            </Section>
        </LegalShell>
    );
}
