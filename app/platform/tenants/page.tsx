import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { listTenants, fmtDate } from '@/lib/api';

export default async function TenantsPage({ searchParams }: { searchParams: Promise<{ archived?: string }> }) {
  const { getToken } = await auth();
  const token = await getToken();
  const { archived } = await searchParams;
  const includeArchived = archived === '1';

  const { tenants } = token
    ? await listTenants(token, 0, includeArchived)
    : { tenants: [] };

  const archivedCount = includeArchived ? tenants.filter(t => t.status === 'archived').length : null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600 }}>
          Tenantit ({tenants.length}{includeArchived ? ', arkistoidut mukaan' : ''})
        </h1>
        <Link
          href={includeArchived ? '/platform/tenants' : '/platform/tenants?archived=1'}
          style={{ fontSize: '12px', color: 'var(--c-text-3)', padding: '5px 12px', border: '1px solid var(--c-border)', borderRadius: '6px', textDecoration: 'none', background: includeArchived ? 'var(--c-surface-2)' : 'transparent' }}
        >
          {includeArchived ? 'Piilota arkistoidut' : 'Näytä arkistoidut'}
        </Link>
      </div>

      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>
              {['Nimi / Clerk ID', 'Plan', 'Tila', 'Tuoteraja', 'Luotu', ''].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 500, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--c-text-3)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--c-border-dim)', opacity: t.status === 'archived' ? 0.55 : 1 }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>{t.name}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--c-text-3)' }}>{t.clerk_org_id}</div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--c-text-2)' }}>{t.plan}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '999px', border: '1px solid var(--c-border)',
                    color: t.status === 'active' ? 'var(--c-ok)' : t.status === 'archived' ? 'var(--c-warn)' : 'var(--c-text-3)',
                    borderColor: t.status === 'active' ? 'var(--c-ok)' : t.status === 'archived' ? 'rgba(196,40,42,.3)' : 'var(--c-border)',
                  }}>{t.status}</span>
                </td>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--c-text-3)' }}>{t.product_limit}</td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--c-text-3)' }}>{fmtDate(t.created_at)}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <Link href={`/platform/tenants/${t.id}`} style={{ fontSize: '13px', color: 'var(--c-accent)' }}>→</Link>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--c-text-3)' }}>Ei tenanteja.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {!includeArchived && (
        <p style={{ fontSize: '11px', color: 'var(--c-text-3)', marginTop: '10px', textAlign: 'right' }}>
          Arkistoidut tenantit piilotettu.{' '}
          <Link href="/platform/tenants?archived=1" style={{ color: 'var(--c-accent)' }}>Näytä kaikki →</Link>
        </p>
      )}
    </div>
  );
}
