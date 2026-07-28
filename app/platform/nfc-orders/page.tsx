import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { listAdminNfcOrders, fmtDate, NfcOrderAdmin } from '@/lib/api';
import { nfcStatusLabel, nfcTagTypeLabel, nfcStatusColor, NFC_STATUS_LABELS } from '@/lib/nfc-labels';

const FILTERS = ['', 'new', 'confirmed', 'processing', 'programmed', 'shipped', 'cancelled'];

export default async function NfcOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { getToken } = await auth();
  const token = await getToken();
  const { status } = await searchParams;
  const active = status && status in NFC_STATUS_LABELS ? status : '';

  const { orders } = token ? await listAdminNfcOrders(token, active || undefined) : { orders: [] as NfcOrderAdmin[] };

  return (
    <div>
      <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>NFC-tilaukset ({orders.length})</h1>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {FILTERS.map(f => (
          <Link key={f || 'all'} href={f ? `/platform/nfc-orders?status=${f}` : '/platform/nfc-orders'}
            style={{
              fontSize: '12px', padding: '5px 12px', borderRadius: '999px', textDecoration: 'none',
              border: '1px solid', borderColor: active === f ? 'var(--c-accent)' : 'var(--c-border)',
              color: active === f ? 'var(--c-accent)' : 'var(--c-text-3)',
              background: active === f ? 'var(--c-accent-dim)' : 'transparent',
            }}>
            {f ? nfcStatusLabel(f) : 'Kaikki'}
          </Link>
        ))}
      </div>

      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>
              {['Tilaus', 'Tenant / Tuote', 'Tyyppi', 'Määrä', 'Tila', 'Luotu', ''].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 500, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--c-text-3)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map(o => {
              const c = nfcStatusColor(o.status);
              return (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--c-border-dim)' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--c-text-2)' }}>{o.order_number}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--c-text-1)' }}>{o.tenant_name ?? '—'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>{o.product_name ?? '—'}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--c-text-2)' }}>{nfcTagTypeLabel(o.tag_type)}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '13px', color: 'var(--c-text-2)' }}>{o.quantity}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', border: '1px solid', color: c.color, borderColor: c.borderColor }}>{nfcStatusLabel(o.status)}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--c-text-3)' }}>{fmtDate(o.created_at)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <Link href={`/platform/nfc-orders/${o.id}`} style={{ fontSize: '13px', color: 'var(--c-accent)' }}>→</Link>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--c-text-3)' }}>Ei tilauksia.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
