import { auth } from '@clerk/nextjs/server';
import { getTenant, ApiError } from '@/lib/api';

export default async function SettingsPage() {
  const { orgId, getToken } = await auth();

  if (!orgId) {
    return <p style={{ color: 'var(--c-text-3)', fontSize: '14px' }}>Valitse ensin organisaatio.</p>;
  }

  const token = await getToken();
  let tenant = null;
  try {
    if (token) {
      // Try via platform admin — or fall back to tenant list endpoint
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tenant/products?limit=0`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok && r.status !== 200) { /* ignore */ }
    }
  } catch { /* ignore */ }

  const row = (label: string, value: string | number | null) => (
    <div style={{ display: 'flex', gap: '16px', padding: '12px 16px', borderBottom: '1px solid var(--c-border-dim)', alignItems: 'baseline' }}>
      <span style={{ flexShrink: 0, width: '160px', fontSize: '13px', color: 'var(--c-text-2)' }}>{label}</span>
      <span style={{ fontSize: '13px', color: 'var(--c-text-1)' }}>{value ?? '—'}</span>
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Asetukset</h1>

      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-text-3)', padding: '10px 16px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>Organisaatio</div>
        {row('Clerk Org ID', orgId)}
      </div>

      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '16px' }}>
        <p style={{ fontSize: '13px', color: 'var(--c-text-3)' }}>
          Organisaation nimeä ja jäseniä hallitaan <a href="/dashboard/team" style={{ color: 'var(--c-accent)' }}>Tiimi-sivulla</a>. Plan-muutokset tehdään platform adminilla.
        </p>
      </div>
    </div>
  );
}
