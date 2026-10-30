import LegalShell, { InShort, Section } from './LegalShell';
import { openCookieSettings } from '../../Components/CookieBanner';

const rows = [
    ['goluckyten_session', 'Essential', 'Keeps you signed in and holds your basket.', 'Until you close the browser (2 hours idle)'],
    ['XSRF-TOKEN', 'Essential', 'Protects forms against cross-site request forgery.', '2 hours'],
    ['remember_web_…', 'Essential', 'Only if you tick “Remember me” at sign-in.', 'Up to 5 years or sign-out'],
    ['lt_consent', 'Essential', 'Remembers your cookie choices.', '6 months'],
    ['lt_ref', 'Essential', 'Remembers which friend invited you, so you both get the referral bonus.', '30 days'],
];

export default function Cookies({ updated }) {
    return (
        <LegalShell
            title="Cookie Policy"
            updated={updated}
            icon="🍪"
            intro="The small files we store in your browser, what each one does, and how to change your mind."
            glance={[
                ['✅', 'Essential only by default', 'Nothing optional runs until you say yes.'],
                ['🎛', 'Change any time', 'Reopen the cookie settings from the footer.'],
                ['📦', 'Local storage', 'A few on-device preferences, like whether you dismissed the install banner.'],
                ['🚫', 'No selling', 'We never sell browsing data.'],
            ]}
        >
            <Section id="what" title="What cookies are">
                <p>Cookies are small text files a website stores in your browser. Some are needed for the site to work, others help measure or personalise it.</p>
            </Section>
            <Section id="list" title="Cookies we set">
                <InShort>Today every cookie we set is essential. Analytics and marketing switches are there so you decide before we ever add them.</InShort>
                <div className="overflow-x-auto rounded-xl border border-line">
                    <table className="w-full min-w-[560px] text-left text-sm">
                        <thead className="bg-ink-2 text-xs uppercase tracking-wider text-mist">
                            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Purpose</th><th className="px-4 py-3">Lasts</th></tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {rows.map(([n, t, p, l]) => (
                                <tr key={n}><td className="px-4 py-3 font-mono text-xs text-white">{n}</td><td className="px-4 py-3 text-jade">{t}</td><td className="px-4 py-3 text-cream/85">{p}</td><td className="px-4 py-3 text-mist">{l}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>
            <Section id="storage" title="On-device storage">
                <p>We also keep a few preferences in your browser’s local and session storage: how many times you’ve visited (for the “install app” prompt), whether you dismissed it, and when your current session started (for the reality-check reminder). These never leave your device.</p>
            </Section>
            <Section id="push" title="Browser notifications">
                <p>If you turn on notifications, your browser gives us a push address. We store it against your account to send draw reminders and win alerts. Turn it off in Notifications or your browser settings.</p>
            </Section>
            <Section id="control" title="Your choices">
                <p>You can accept or refuse optional cookies in the banner, and change your mind at any time.</p>
                <button onClick={openCookieSettings} className="btn btn-primary btn-sm mt-2">Open cookie settings</button>
                <p>You can also block or delete cookies in your browser settings, but essential cookies are needed to sign in and pay.</p>
            </Section>
        </LegalShell>
    );
}
