import { Link, useForm } from '@inertiajs/react';
import AuthShell from './AuthShell';
import { Checkbox, Input, Select } from '../../Components/Form';

function Group({ title, note, children }) {
    return (
        <fieldset className="border-t border-line pt-7 first:border-t-0 first:pt-0">
            <legend className="float-left mb-5 w-full">
                <span className="font-display text-xl text-gold-hi">{title}</span>
                {note && <span className="mt-1 block text-sm text-mist">{note}</span>}
            </legend>
            <div className="clear-both grid gap-5 sm:grid-cols-2">{children}</div>
        </fieldset>
    );
}

export default function Register({ countries, minAge, referrer, referralBonusCents }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        password_confirmation: '',
        name: '',
        surname: '',
        phone: '',
        date_of_birth: '',
        address_line: '',
        city: '',
        country: '',
        post_code: '',
        terms: false,
        profile_public: false,
    });

    const maxDob = new Date();
    maxDob.setFullYear(maxDob.getFullYear() - minAge);

    const bind = (key) => ({ value: data[key], onChange: (e) => setData(key, e.target.value), error: errors[key], name: key });

    const submit = (e) => {
        e.preventDefault();
        post('/register', { onError: () => window.scrollTo({ top: 0, behavior: 'smooth' }) });
    };

    return (
        <AuthShell
            title="Create account"
            heading="Create your account"
            intro="We need your real details so we can verify winners and deliver prizes. They’re never shown publicly."
            wide
        >
            {referrer && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber/30 bg-amber/10 p-4 text-sm text-amber">
                    <span className="text-2xl" aria-hidden="true">🎁</span>
                    <span><strong>{referrer}</strong> invited you. Make your first entry of €1 or more and you’ll both get €{(referralBonusCents / 100).toFixed(2)} in your wallets.</span>
                </div>
            )}
            <form onSubmit={submit} className="card space-y-7 p-6 sm:p-9" noValidate>
                <Group title="Sign-in details">
                    <Input label="Email" type="email" autoComplete="email" className="sm:col-span-2" required {...bind('email')} />
                    <Input label="Password" type="password" autoComplete="new-password" hint="At least 8 characters, with letters and numbers." required {...bind('password')} />
                    <Input label="Repeat password" type="password" autoComplete="new-password" required {...bind('password_confirmation')} />
                </Group>

                <Group title="About you" note={`You must be ${minAge} or over to play.`}>
                    <Input label="Name" autoComplete="given-name" required {...bind('name')} />
                    <Input label="Surname" autoComplete="family-name" required {...bind('surname')} />
                    <Input label="Phone number" type="tel" autoComplete="tel" placeholder="+371 20 000 000" hint="Include your country code." required {...bind('phone')} />
                    <Input label="Date of birth" type="date" autoComplete="bday" max={maxDob.toISOString().slice(0, 10)} required {...bind('date_of_birth')} />
                </Group>

                <Group title="Address" note="Prizes are delivered here.">
                    <Input label="Street, house number, apartment" autoComplete="street-address" placeholder="Brīvības iela 1, apt. 12" className="sm:col-span-2" required {...bind('address_line')} />
                    <Input label="City" autoComplete="address-level2" required {...bind('city')} />
                    <Input label="Post code" autoComplete="postal-code" required {...bind('post_code')} />
                    <Select label="Country" autoComplete="country" className="sm:col-span-2" required {...bind('country')}>
                        <option value="" disabled>Select your country</option>
                        {countries.map((c) => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                    </Select>
                </Group>

                <div className="space-y-4 border-t border-line pt-7">
                    <Checkbox checked={data.profile_public} onChange={(e) => setData('profile_public', e.target.checked)} name="profile_public">
                        Show my public player profile (first name, surname initial, city, competitions entered and wins). You can change this any time.
                    </Checkbox>
                    <Checkbox checked={data.terms} onChange={(e) => setData('terms', e.target.checked)} error={errors.terms} name="terms">
                        I agree to the{' '}
                        <a href="/terms" target="_blank" rel="noopener" className="text-gold-hi underline underline-offset-2">Terms &amp; Conditions</a>{' '}
                        and{' '}
                        <a href="/privacy" target="_blank" rel="noopener" className="text-gold-hi underline underline-offset-2">Privacy Policy</a>.
                    </Checkbox>
                </div>

                <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:justify-between">
                    <p className="text-sm text-mist">
                        Already have an account? <Link href="/login" className="text-gold-hi underline underline-offset-4">Sign in</Link>
                    </p>
                    <button type="submit" disabled={processing} className="btn btn-gold w-full sm:w-auto">
                        {processing ? 'Creating account…' : 'Create account'}
                    </button>
                </div>
            </form>
        </AuthShell>
    );
}
