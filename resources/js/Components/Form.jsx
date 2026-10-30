import { useId } from 'react';

export function Field({ label, error, hint, children, className = '', htmlFor }) {
    return (
        <div className={className}>
            {label && (
                <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-cream/90">
                    {label}
                </label>
            )}
            {children}
            {hint && !error && <p className="mt-1.5 text-xs text-mist">{hint}</p>}
            {error && (
                <p className="mt-1.5 text-xs text-ruby" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

export function Input({ label, error, hint, className = '', id, ...props }) {
    const auto = useId();
    const fid = id ?? auto;
    return (
        <Field label={label} error={error} hint={hint} className={className} htmlFor={fid}>
            <input id={fid} className="field" aria-invalid={error ? 'true' : undefined} {...props} />
        </Field>
    );
}

export function Textarea({ label, error, hint, className = '', id, ...props }) {
    const auto = useId();
    const fid = id ?? auto;
    return (
        <Field label={label} error={error} hint={hint} className={className} htmlFor={fid}>
            <textarea id={fid} className="field min-h-28" aria-invalid={error ? 'true' : undefined} {...props} />
        </Field>
    );
}

export function Select({ label, error, hint, className = '', id, children, ...props }) {
    const auto = useId();
    const fid = id ?? auto;
    return (
        <Field label={label} error={error} hint={hint} className={className} htmlFor={fid}>
            <select id={fid} className="field" aria-invalid={error ? 'true' : undefined} {...props}>
                {children}
            </select>
        </Field>
    );
}

export function Checkbox({ children, error, className = '', ...props }) {
    const id = useId();
    return (
        <div className={className}>
            <div className="flex items-start gap-3">
                <input
                    id={id}
                    type="checkbox"
                    className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-line-2 bg-ink-2 accent-[#d8b26a]"
                    aria-invalid={error ? 'true' : undefined}
                    {...props}
                />
                <label htmlFor={id} className="cursor-pointer text-sm leading-relaxed text-cream/90">
                    {children}
                </label>
            </div>
            {error && (
                <p className="mt-1.5 pl-8 text-xs text-ruby" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
