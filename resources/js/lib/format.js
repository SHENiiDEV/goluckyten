const symbols = { EUR: '€', GBP: '£', USD: '$' };

export function money(cents, currency = 'EUR', { compact = false } = {}) {
    const value = (cents ?? 0) / 100;
    const sym = symbols[currency] ?? `${currency} `;
    if (compact && value >= 1000) {
        const whole = Number.isInteger(value) || value >= 10000;
        return sym + value.toLocaleString('en-GB', { maximumFractionDigits: whole ? 0 : 2 });
    }
    return sym + value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function number(n) {
    return (n ?? 0).toLocaleString('en-GB');
}

export function dateTime(iso) {
    return new Date(iso).toLocaleString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
}

export function date(iso) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function pct(sold, max) {
    if (!max) return 0;
    return Math.min(100, Math.round((sold / max) * 100));
}

export function plural(n, one, many) {
    return `${number(n)} ${n === 1 ? one : many}`;
}
