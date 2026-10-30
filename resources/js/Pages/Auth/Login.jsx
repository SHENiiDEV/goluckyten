import { Link, useForm } from '@inertiajs/react';
import AuthShell from './AuthShell';
import { Checkbox, Input } from '../../Components/Form';

export default function Login({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '', password: '', remember: true });

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <AuthShell title="Sign in" heading="Welcome back">
            {status && <p className="mb-5 rounded-xl border border-jade/40 bg-jade/10 p-3 text-sm text-[#8fd9c1]">{status}</p>}
            <form onSubmit={submit} className="card space-y-5 p-6 sm:p-8">
                <Input label="Email" type="email" autoComplete="email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} autoFocus />
                <Input label="Password" type="password" autoComplete="current-password" value={data.password} onChange={(e) => setData('password', e.target.value)} error={errors.password} />
                <div className="flex items-center justify-between">
                    <Checkbox checked={data.remember} onChange={(e) => setData('remember', e.target.checked)}>Keep me signed in</Checkbox>
                    <Link href="/forgot-password" className="text-sm text-gold-hi underline-offset-4 hover:underline">Forgot password?</Link>
                </div>
                <button type="submit" disabled={processing} className="btn btn-gold w-full">Sign in</button>
            </form>
            <p className="mt-6 text-center text-sm text-mist">
                New here? <Link href="/register" className="text-gold-hi underline underline-offset-4">Create an account</Link>
            </p>
        </AuthShell>
    );
}
