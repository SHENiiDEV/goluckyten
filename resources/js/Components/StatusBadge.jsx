const styles = {
    live: 'border-gold-deep/60 text-gold-hi',
    draft: 'border-line-2 text-mist',
    closed: 'border-line-2 text-cream',
    drawn: 'border-jade/50 text-[#8fd9c1]',
    pending: 'border-gold-deep/60 text-gold-hi',
    awaiting_letter: 'border-violet/50 text-violet-hi',
    approved: 'border-jade/50 text-[#8fd9c1]',
    rejected: 'border-ruby/50 text-ruby',
    paid: 'border-jade/50 text-[#8fd9c1]',
    failed: 'border-ruby/50 text-ruby',
    free: 'border-jade/50 text-[#8fd9c1]',
    processing: 'border-gold-deep/60 text-gold-hi',
    shipped: 'border-jade/50 text-[#8fd9c1]',
};

const labels = { live: 'Live', draft: 'Draft', closed: 'Closed', drawn: 'Drawn', pending: 'Pending', awaiting_letter: 'Waiting for letter', approved: 'Approved', rejected: 'Rejected', paid: 'Paid', failed: 'Failed', free: 'Free entry', processing: 'Being paid out', shipped: 'Shipped' };

export default function StatusBadge({ status }) {
    return <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${styles[status] ?? 'border-line text-mist'}`}>{labels[status] ?? status}</span>;
}
