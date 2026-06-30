import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { listProducts, statusLabel, statusColor, fmtDate, ProductSummary, ApiError } from '@/lib/api';
import { CreateOrganization } from '@clerk/nextjs';

export default async function ProductsPage() {
  const { orgId, getToken } = await auth();

  if (!orgId) {
    return (
      <div className="flex flex-col items-center py-20 gap-6">
        <p style={{ color: 'var(--c-text-2)', fontSize: '14px' }}>
          Luo tai valitse organisaatio aloittaaksesi.
        </p>
        <CreateOrganization afterCreateOrganizationUrl="/dashboard/products" />
      </div>
    );
  }

  const token = await getToken();
  let products: ProductSummary[] = [];
  // null = ok, string = specific error code from Worker (tenant_inactive / tenant_suspended / tenant_archived / tenant_not_found)
  let tenantBlockedError: string | null = null;
  let fetchError: string | null = null;
  const BLOCKED_ERRORS = new Set(['tenant_inactive', 'tenant_suspended', 'tenant_archived', 'tenant_blocked']);
  try {
    if (token) products = await listProducts(token);
  } catch (e) {
    if (e instanceof ApiError && e.status === 403) {
      const errCode = (e.body as { error?: string })?.error ?? '';
      if (BLOCKED_ERRORS.has(errCode)) {
        tenantBlockedError = errCode;
      } else {
        // tenant_not_found, no_active_organization, or unknown 403 — show diagnostic, not "frozen"
        fetchError = `Tuotteiden lataus epäonnistui (${errCode || 'virhe 403'}). Tarkista tilisi tila asetuksista.`;
      }
    } else if (e instanceof ApiError) {
      fetchError = `Tuotteiden lataus epäonnistui (virhe ${e.status}). Yritä päivittää sivu.`;
    } else {
      fetchError = 'Yhteysvirhe — tarkista verkkoyhteys ja päivitä sivu.';
    }
  }

  return (
    <div>
      {tenantBlockedError && (
        <div style={{ background: 'rgba(196,40,42,.06)', border: '1px solid rgba(196,40,42,.25)', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠</span>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--c-warn)', marginBottom: '4px' }}>
              {tenantBlockedError === 'tenant_suspended' ? 'Tili jäädytetty' :
               tenantBlockedError === 'tenant_inactive' ? 'Tili ei ole aktiivinen' :
               'Tili arkistoitu'}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--c-warn)' }}>
              Tuotteiden luonti on estetty. Tarkista tilisi tila{' '}
              <Link href="/dashboard/settings" style={{ color: 'var(--c-warn)', fontWeight: 600 }}>asetuksista</Link>.
            </p>
          </div>
        </div>
      )}
      {fetchError && (
        <div style={{ background: 'rgba(196,40,42,.06)', border: '1px solid rgba(196,40,42,.25)', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠</span>
          <p style={{ fontSize: '13px', color: 'var(--c-warn)' }}>{fetchError}</p>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--c-text-1)' }}>Tuotteet</h1>
          <p style={{ fontSize: '13px', color: 'var(--c-text-3)', marginTop: '2px' }}>{products.length} tuotetta</p>
        </div>
        {!tenantBlockedError && (
          <Link
            href="/dashboard/products/new"
            style={{ background: 'var(--c-accent)', color: '#fff', fontSize: '13px', fontWeight: 500, padding: '8px 16px', borderRadius: '8px', textDecoration: 'none' }}
          >
            + Uusi tuote
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <div
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '48px', textAlign: 'center' }}
        >
          <p style={{ color: 'var(--c-text-3)', fontSize: '14px' }}>Ei tuotteita vielä.</p>
          <Link
            href="/dashboard/products/new"
            style={{ display: 'inline-block', marginTop: '16px', color: 'var(--c-accent)', fontSize: '13px' }}
          >
            Luo ensimmäinen tuote →
          </Link>
        </div>
      ) : (
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>
                {['Tuote', 'Tila', 'Versio', 'Päivitetty', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 500, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--c-text-3)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--c-border-dim)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--c-text-1)' }}>{p.product_name}</div>
                    {p.brand_name && <div style={{ fontSize: '12px', color: 'var(--c-text-3)', marginTop: '2px' }}>{p.brand_name}</div>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '999px', border: '1px solid' }} className={statusColor(p.status)}>
                      {statusLabel(p.status)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--c-text-3)' }}>v{p.version}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--c-text-3)' }}>{fmtDate(p.updated_at)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <Link
                      href={`/dashboard/products/${p.public_slug}`}
                      style={{ fontSize: '13px', color: 'var(--c-accent)' }}
                    >
                      Muokkaa →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
