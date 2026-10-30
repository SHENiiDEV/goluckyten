import { Link, usePage } from '@inertiajs/react';
import LegalShell, { InShort, Section } from './LegalShell';

export default function Terms({ updated, minAge, restricted }) {
    const { company } = usePage().props;

    return (
        <LegalShell
            title="Terms & Conditions"
            updated={updated}
            icon="📜"
            intro="The rules for every competition on GoLuckyTen, paid or free. Section 6 explains how to enter any competition without paying."
            glance={[
                ['🔞', `${minAge}+ only`, 'One account per person, real details, verified before any prize is paid.'],
                ['🎟', 'Fixed ticket pools', 'Every competition shows its maximum tickets. That number is never exceeded.'],
                ['✉️', 'Always free to enter', 'A free entry has exactly the same chance as a paid one.'],
                ['🔐', 'Provably fair draws', 'We publish a fingerprint before the draw and the seed after, so anyone can check.'],
            ]}
        >
            <Section id="about" title="About us">
                <p>
                    The website is operated by {company.name} (company number {company.number}), registered at {company.address} (“we”, “us”). Contact us at{' '}
                    <a href={`mailto:${company.email}`}>{company.email}</a>. By creating an account or entering a competition, paid or free, you agree to these terms.
                </p>
            </Section>

            <Section id="eligibility" title="Who can play">
                <InShort>Adults only, in countries where it’s legal, and not our staff.</InShort>
                <ol>
                    <li>You must be at least {minAge} years old and resident in a country where taking part is lawful.</li>
                    <li>Residents of the following countries cannot register or enter: {restricted.join(', ')}.</li>
                    <li>Our employees, their immediate families and anyone professionally connected with a competition cannot enter it.</li>
                    <li>We may ask for proof of age, identity and address at any time, and always before a prize is awarded or a withdrawal is paid.</li>
                </ol>
            </Section>

            <Section id="account" title="Your account">
                <ol>
                    <li>You may hold one account. The details you give at registration (name, surname, date of birth, phone number and address) must be true and kept up to date.</li>
                    <li>You are responsible for keeping your password secret and for all activity on your account.</li>
                    <li>You can download your data or close your account at any time from your profile. See our <Link href="/privacy">Privacy Policy</Link>.</li>
                    <li>We may suspend or close accounts that break these terms; entries made in breach may be cancelled.</li>
                </ol>
            </Section>

            <Section id="raffles" title="How competitions work">
                <ol>
                    <li>Each competition page shows the prize, the ticket price, the maximum number of tickets, the per-person limit and the draw date and time.</li>
                    <li>The maximum number of tickets includes both paid and free entries and will never be exceeded.</li>
                    <li>
                        <strong>Ticket numbers.</strong> By default each ticket gets a unique number at random (“lucky dip”). You may instead choose specific numbers
                        when adding tickets. A chosen number is reserved only once payment succeeds; if someone else takes it first, checkout tells you and you can pick again.
                    </li>
                    <li>Entries close at the draw time or when all tickets have been issued, whichever comes first.</li>
                </ol>
                <h3 id="instant-wins">Instant wins</h3>
                <ol>
                    <li>Some competitions include instant-win prizes. Before sales open, each instant prize is assigned to a ticket number chosen by a secure random generator. These numbers are kept secret.</li>
                    <li>If a ticket issued to you (paid or free, chosen or lucky dip) carries one of those numbers, you win that prize immediately. It is shown on your order page and in your account.</li>
                    <li>Cash instant prizes are credited to your GoLuckyTen wallet straight away (section 8). Item prizes are dispatched after verification, normally within 7 days.</li>
                    <li>The competition page shows how many instant prizes of each kind remain. An instant win does not remove your ticket from the main draw.</li>
                    <li>If a competition closes before every ticket is issued, instant prizes behind unissued numbers are not awarded.</li>
                </ol>
            </Section>

            <Section id="paid" title="Paid entries">
                <ol>
                    <li>Prices are shown in euros and include any applicable taxes. A VAT invoice is emailed with every order and can be downloaded from your account.</li>
                    <li>Your tickets are issued once payment is confirmed. Ticket numbers then appear in your account and in your order confirmation.</li>
                    <li>A purchase is not an investment and spending more does not guarantee a prize. Please read our <Link href="/responsible-play">Responsible play</Link> page.</li>
                </ol>
            </Section>

            <Section id="free-entry" title="Free entry route (no purchase necessary)">
                <InShort>Ask once per competition, before it closes, and you get one ticket with the same odds as everyone else.</InShort>
                <ol>
                    <li>
                        <strong>How to request.</strong> Sign in and use the <Link href="/free-entry">free entry form</Link>, or email{' '}
                        <a href={`mailto:${company.free_entry_email}`}>{company.free_entry_email}</a> from the address registered on your account.
                    </li>
                    <li>
                        <strong>What to include.</strong> The competition you want to enter, your full name, email address, postal address and a short request in your own words
                        (for example: “I would like to enter the [competition name] for free”).
                    </li>
                    <li><strong>Limit.</strong> One free entry per person per competition.</li>
                    <li><strong>Timing.</strong> Requests must reach us before entries close. Requests received after closing, or for a sold-out competition, cannot be accepted.</li>
                    <li><strong>What happens next.</strong> We check each request against these rules. When approved, one ticket with a random number is added to your account and we email you the number.</li>
                    <li><strong>Not accepted.</strong> Requests that are automated, sent in bulk, made for someone else, incomplete, or that use a different identity from the account holder.</li>
                    <li>Free entries are subject to all other parts of these terms, including eligibility, self-exclusion and verification.</li>
                </ol>
            </Section>

            <Section id="draw" title="The draw">
                <InShort>Nobody, including us, can pick or change the winner once the competition opens.</InShort>
                <ol>
                    <li>The draw takes place automatically at the published time on the competition’s <strong>live draw page</strong>, or as soon as possible after it sells out.</li>
                    <li>
                        <strong>Commit.</strong> When a competition is created we generate a secret 256-bit random seed and publish its SHA-256 fingerprint on the live draw page.
                    </li>
                    <li>
                        <strong>Draw.</strong> All issued tickets are sorted by number. The winning ticket is the one at position HMAC-SHA256(seed, “competition id:ticket count”),
                        read as a number from its first 13 hexadecimal digits, modulo the ticket count.
                    </li>
                    <li>
                        <strong>Reveal.</strong> After the draw we publish the seed and the full list of issued numbers, so anyone can confirm the fingerprint and repeat the calculation.
                    </li>
                    <li>The winner’s first name, surname initial, town and winning number are published on the <Link href="/winners">winners page</Link>.</li>
                    <li>We contact the winner by email and phone within 48 hours. If we cannot reach the winner or they cannot prove eligibility within 14 days, we redraw using the same method with a new published seed.</li>
                </ol>
            </Section>

            <Section id="prizes" title="Prizes">
                <ol>
                    <li>Prizes are as described on the competition page. Where a cash alternative is shown, the winner may choose it instead.</li>
                    <li>Prizes are not transferable. If a prize becomes unavailable we may substitute one of equal or greater value.</li>
                    <li>The winner is responsible for any taxes or duties due in their country of residence.</li>
                </ol>
            </Section>

            <Section id="wallet" title="Your wallet">
                <ol>
                    <li>Your wallet holds cash instant wins, referral bonuses and refunds. It is not a bank or deposit account, earns no interest and you cannot add your own money to it.</li>
                    <li>You can use your balance towards tickets at checkout, or withdraw it by bank transfer to an account in your own name. The minimum withdrawal is €10 and we normally pay within 3 working days.</li>
                    <li>We may ask for identity verification before paying a withdrawal. Balance from bonuses obtained in breach of these terms may be removed.</li>
                    <li>Wallet money does not expire. If you close your account you must withdraw your balance first.</li>
                </ol>
            </Section>

            <Section id="referrals" title="Referrals">
                <ol>
                    <li>You can invite friends using your personal link. When a new player joins through it and makes paid entries totalling at least the amount shown on your Invite page, you both receive the bonus shown there in your wallets.</li>
                    <li>The bonus is paid once per new player. Self-referrals, duplicate accounts, and links shared through paid advertising or spam are not allowed and void the bonus.</li>
                    <li>We may change or end the referral scheme at any time; bonuses already earned are kept.</li>
                </ol>
            </Section>

            <Section id="promotions" title="Promo codes and flash sales">
                <ol>
                    <li>Promo codes give the discount shown when applied, subject to their minimum spend, dates and usage limits. One code per order. Codes have no cash value.</li>
                    <li>A flash sale lowers the ticket price of a competition until the time shown. The price you pay is the one shown in your basket at checkout.</li>
                    <li>Discounts never change the number of tickets, the odds or the free entry route.</li>
                </ol>
            </Section>

            <Section id="safer-play" title="Spend limits and breaks">
                <ol>
                    <li>You can set a daily, weekly or monthly spend limit in <Link href="/account/safer-play">Safer play</Link>. Lowering a limit applies immediately; raising or removing it applies after 24 hours.</li>
                    <li>You can take a break (self-exclusion) from 24 hours to 5 years. During a break you cannot buy tickets or request free entries, and the break cannot be shortened. Tickets already issued stay in their draws.</li>
                    <li>If you believe you have a gambling problem, please also use the support services listed on our <Link href="/responsible-play">Responsible play</Link> page.</li>
                </ol>
            </Section>

            <Section id="cancel" title="Cancellation and refunds">
                <ol>
                    <li>Because each ticket enters a draw immediately, tickets cannot be cancelled once issued.</li>
                    <li>If we cancel a competition, every paid entry is refunded in full: card payments to the card, wallet payments to the wallet.</li>
                </ol>
            </Section>

            <Section id="conduct" title="Fair play">
                <p>You must not use bots, scripts, multiple accounts or any other method to gain an unfair advantage. We may void entries and close accounts where we reasonably suspect this.</p>
            </Section>

            <Section id="liability" title="Liability">
                <p>Nothing in these terms limits liability that cannot be limited by law. Otherwise, our total liability to you in connection with a competition is limited to the amount you paid for entries in it.</p>
            </Section>

            <Section id="general" title="General">
                <p>
                    We may update these terms; the version shown when you enter a competition applies to that entry. How we use your personal data is explained in our{' '}
                    <Link href="/privacy">Privacy Policy</Link> and <Link href="/cookies">Cookie Policy</Link>.
                </p>
            </Section>
        </LegalShell>
    );
}
