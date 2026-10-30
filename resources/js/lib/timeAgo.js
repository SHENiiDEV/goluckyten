export default function timeAgo(iso) {
    const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} h ago`;
    const d = Math.round(h / 24);
    if (d < 30) return `${d} d ago`;
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
