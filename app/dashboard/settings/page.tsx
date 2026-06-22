import { auth } from '@clerk/nextjs/server';
import { getTenantSelf, ApiError } from '@/lib/api';

const PLAN_LABEL: Record<string, string> = { free: 'Free', starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' };
const STATUS_LABEL: Record<string, string> = { trial: 'Trial', active: 'Aktiivinen', suspended: 'Jäädytetty', inactive: 'Inaktiivinen' };
const BILLING_LABEL: Record<string, string> = { active: 'Aktiivinen', past_due: 'Myöhässä', canceled: 'Peruutettu', trialing: 'Trial' };

export default async function SettingsPage() {
  const { orgId, getToken } = await auth();

  if (!orgId) {
    return <p style={{ color: 'var(--c-text-3)', fontSize: '14px' }}>Valitse ensin organisaatio.</p>;
  }

  const token = await getToken();
  let tenant = null;
  let fetchError: string | null = null;

  try {
    if (token) tenant = await getTenantSelf(token);
  } catch (e) {
    if (e instanceof ApiError) {
      const body = e.body as { error?: string };
      fetchError = body.error ?? 'error';
    } else {
      fetchError = 'network_error';
    }
  }

  const row = (label: string, value: React.ReactNode) => (
    <div style={{ display: 'flex', gap: '16px', padding: '12px 16px', borderBottom: '1px solid var(--c-border-dim)', alignItems: 'center' }}>
      <span style={{ flexShrink: 0, width: '160px', fontSize: '13px', color: 'var(--c-text-2)' }}>{label}</span>
      <span style={{ fontSize: '13px', color: 'var(--c-text-1)' }}>{value}</span>
    </div>
  );

  const suspended = tenant?.status === 'suspended' || tenant?.status === 'inactive';

  return (
    <div>
      <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Asetukset</h1>

      {suspended && (
        <div style={{ background: 'rgba(196,40,42,.06)', border: '1px solid rgba(196,40,42,.25)', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠</span>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--c-warn)', marginBottom: '4px' }}>Tili jäädytetty</p>
            <p style={{ fontSize: '13px', color: 'var(--c-warn)' }}>Tuotteiden luonti ja muokkaus on estetty. Ota yhteyttä tukeen tilisi aktivoimiseksi.</p>
          </div>
        </div>
      )}

      {fetchError && !tenant && (
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--c-warn)' }}>Tenant-tietoja ei voitu ladata. Varmista, että organisaatio on aktiivinen.</p>
        </div>
      )}

      {tenant && (
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-text-3)', padding: '10px 16px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>Organisaatio</div>
          {row('Nimi', tenant.name)}
          {row('Clerk Org ID', <code style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--c-text-3)' }}>{orgId}</code>)}
          {row('Plan', (
            <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 10px', borderRadius: '999px', background: 'var(--c-accent-dim)', color: 'var(--c-accent)', border: '1px solid rgba(10,109,194,.2)' }}>
              {PLAN_LABEL[tenant.plan] ?? tenant.plan}
            </span>
          ))}
          {row('Tila', (
            <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 10px', borderRadius: '999px', border: '1px solid', color: suspended ? 'var(--c-warn)' : tenant.status === 'active' ? 'var(--c-ok)' : 'var(--c-text-2)', borderColor: suspended ? 'rgba(196,40,42,.3)' : tenant.status === 'active' ? 'rgba(34,197,94,.4)' : 'var(--c-border)', background: suspended ? 'rgba(196,40,42,.06)' : tenant.status === 'active' ? 'rgba(34,197,94,.08)' : 'transparent' }}>
              {STATUS_LABEL[tenant.status] ?? tenant.status}
            </span>
          ))}
          {row('Laskutus', BILLING_LABEL[tenant.billing_status] ?? tenant.billing_status)}
          {row('Tuotteet', (
            <span style={{ fontSize: '13px' }}>
              <strong style={{ color: tenant.product_count >= tenant.product_limit ? 'var(--c-warn)' : 'var(--c-text-1)' }}>{tenant.product_count}</strong>
              <span style={{ color: 'var(--c-text-3)' }}> / {tenant.product_limit}</span>
              <span style={{ display: 'inline-block', marginLeft: '10px', width: '80px', height: '6px', background: 'var(--c-border)', borderRadius: '3px', verticalAlign: 'middle', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${Math.min(100, (tenant.product_count / tenant.product_limit) * 100)}%`, background: tenant.product_count >= tenant.product_limit ? 'var(--c-warn)' : 'var(--c-ok)', borderRadius: '3px' }} />
              </span>
            </span>
          ))}
        </div>
      )}

      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '14px 16px' }}>
        <p style={{ fontSize: '13px', color: 'var(--c-text-2)' }}>
          Jäseniä ja kutsuja hallitaan <a href="/dashboard/team" style={{ color: 'var(--c-accent)' }}>Tiimi-sivulla</a>.
          Plan-muutokset ja tuoterajojen korotukset tehdään platform adminilla.
        </p>
      </div>
    </div>
  );
}
