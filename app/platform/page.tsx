import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { listTenants, listUnclaimed, getAdminStats } from '@/lib/api';

export default async function PlatformPage() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return null;

  const [{ tenants }, { products: unclaimed }, stats] = await Promise.all([
    listTenants(token, 0),
    listUnclaimed(token),
    getAdminStats(token),
  ]);

  const active = tenants.filter(t => t.status === 'active').length;
  const trial = tenants.filter(t => t.status === 'trial').length;

  const stat = (label: string, value: number | string, href?: string) => (
    <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '20px 24px' }}>
      <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-text-3)', marginBottom: '8px' }}>{label}</div>
      {href
        ? <Link href={href} style={{ fontSize: '28px', fontWeight: 700, color: 'var(--c-text-1)', textDecoration: 'none' }}>{value}</Link>
        : <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--c-text-1)' }}>{value}</div>
      }
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Platform — yleiskatsaus</h1>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stat('Tenantit yhteensä', tenants.length, '/platform/tenants')}
        {stat('Aktiiviset', active)}
        {stat('Trial', trial)}
        {stat('Tuotteita', stats.product_count)}
        {stat('Lunastamatta', unclaimed.length, '/platform/products/unclaimed')}
      </div>

      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-text-3)', padding: '10px 16px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>Uusimmat tenantit</div>
        {tenants.slice(0, 10).map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid var(--c-border-dim)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{t.name}</div>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--c-text-3)' }}>{t.clerk_org_id}</div>
            </div>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', border: '1px solid', color: t.status === 'active' ? 'var(--c-ok)' : 'var(--c-text-3)', borderColor: t.status === 'active' ? 'var(--c-ok)' : 'var(--c-border)', background: t.status === 'active' ? 'var(--c-ok-dim, rgba(21,128,61,.07))' : 'transparent' }}>{t.plan} / {t.status}</span>
            <Link href={`/platform/tenants/${t.id}`} style={{ fontSize: '13px', color: 'var(--c-accent)' }}>→</Link>
          </div>
        ))}
        {tenants.length > 10 && (
          <div style={{ padding: '12px 16px' }}>
            <Link href="/platform/tenants" style={{ fontSize: '13px', color: 'var(--c-accent)' }}>Näytä kaikki {tenants.length} →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
