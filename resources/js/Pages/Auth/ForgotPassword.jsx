import { Link, useForm } from '@inertiajs/react';
import AuthShell from './AuthShell';
import { Input } from '../../Components/Form';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    return (
        <AuthShell title="Reset password" heading="Reset your password" intro="Enter the email you signed up with and we’ll send you a link to choose a new password.">
            {status && <p className="mb-5 rounded-xl border border-jade/40 bg-jade/10 p-3 text-sm text-[#8fd9c1]">{status}</p>}
            <form onSubmit={(e) => { e.preventDefault(); post('/forgot-password'); }} className="card space-y-5 p-6 sm:p-8">
                <Input label="Email" type="email" autoComplete="email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} autoFocus />
                <button type="submit" disabled={processing} className="btn btn-gold w-full">Send reset link</button>
            </form>
            <p className="mt-6 text-center text-sm text-mist"><Link href="/login" className="text-gold-hi underline underline-offset-4">Back to sign in</Link></p>
        </AuthShell>
    );
}
