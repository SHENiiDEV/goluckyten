import { useForm } from '@inertiajs/react';
import AuthShell from './AuthShell';
import { Input } from '../../Components/Form';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors } = useForm({ token, email, password: '', password_confirmation: '' });

    return (
        <AuthShell title="Choose a new password" heading="Choose a new password">
            <form onSubmit={(e) => { e.preventDefault(); post('/reset-password'); }} className="card space-y-5 p-6 sm:p-8">
                <Input label="Email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} />
                <Input label="New password" type="password" autoComplete="new-password" value={data.password} onChange={(e) => setData('password', e.target.value)} error={errors.password} hint="At least 8 characters, with letters and numbers." />
                <Input label="Repeat new password" type="password" autoComplete="new-password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} />
                <button type="submit" disabled={processing} className="btn btn-gold w-full">Save password</button>
            </form>
        </AuthShell>
    );
}
