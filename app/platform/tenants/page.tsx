import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { listTenants, fmtDate } from '@/lib/api';

export default async function TenantsPage() {
  const { getToken } = await auth();
  const token = await getToken();
  const { tenants } = token ? await listTenants(token, 0) : { tenants: [] };

  return (
    <div>
      <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Tenantit ({tenants.length})</h1>

      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>
              {['Nimi', 'Plan', 'Tila', 'Tuoterajat', 'Luotu', ''].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 500, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--c-text-3)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--c-border-dim)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>{t.name}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--c-text-3)' }}>{t.slug ?? t.clerk_org_id.slice(0, 20)}</div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--c-text-2)' }}>{t.plan}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', border: '1px solid var(--c-border)', color: t.status === 'active' ? 'var(--c-ok)' : 'var(--c-text-3)' }}>{t.status}</span>
                </td>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--c-text-3)' }}>{t.product_limit}</td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--c-text-3)' }}>{fmtDate(t.created_at)}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <Link href={`/platform/tenants/${t.id}`} style={{ fontSize: '13px', color: 'var(--c-accent)' }}>→</Link>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--c-text-3)' }}>Ei tenanteja vielä.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
