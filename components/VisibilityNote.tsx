// Small badge telling the user whether a section's data is public (shown on the
// public product passport) or private (dashboard-only). Grounded in the Worker's
// consumer-visibility list: public fields = product/brand/type, manufacturer,
// responsible operator, materials, substances, care/repair/recycling, safety.
// Private = internal customer/order info and identifiers (SKU/GTIN/batch/serial).

export default function VisibilityNote({ scope }: { scope: 'public' | 'private' }) {
  const isPublic = scope === 'public';
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '999px',
        border: '1px solid',
        color: isPublic ? 'var(--c-accent)' : 'var(--c-text-3)',
        borderColor: isPublic ? 'var(--c-accent)' : 'var(--c-border)',
        background: isPublic ? 'var(--c-accent-dim)' : 'var(--c-surface-2)',
      }}
    >
      {isPublic ? '🌐 Näkyy julkisessa tuotepassissa' : '🔒 Vain omaan käyttöön – ei näy julkisessa tuotepassissa'}
    </span>
  );
}
