'use client';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { listBilling, updateBilling, TenantBillingRow } from '@/lib/api';

const STATUS_LABEL: Record<string, string> = {
  not_due: 'Ei erääntynyt', due_now: 'Laskuta nyt', overdue: 'Myöhässä',
  invoiced: 'Odottaa maksua', paid: 'Maksettu',
};
const STATUS_COLOR: Record<string, string> = {
  not_due: 'var(--c-text-3)', due_now: 'var(--c-accent)', overdue: 'var(--c-warn)',
  invoiced: '#d97706', paid: 'var(--c-ok)',
};
const STATUS_BG: Record<string, string> = {
  not_due: 'transparent', due_now: 'rgba(10,109,194,.07)', overdue: 'rgba(196,40,42,.06)',
  invoiced: 'rgba(217,119,6,.07)', paid: 'rgba(34,197,94,.07)',
};

type EnrichedRow = TenantBillingRow & { _eff: TenantBillingRow['billing_status'] };
type PatchFn = (tenantId: string, body: Parameters<typeof updateBilling>[2]) => Promise<void>;

function today() { return new Date().toISOString().slice(0, 10); }

function addMonths(date: string, n: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

function isActive(row: TenantBillingRow) {
  return row.tenant_status === 'active' || row.tenant_status === 'trial';
}

const inpStyle: React.CSSProperties = {
  fontSize: '13px', color: 'var(--c-text-1)', background: 'var(--c-surface-2)',
  border: '1px solid var(--c-border)', borderRadius: '5px', padding: '4px 7px',
  outline: 'none', width: '100%',
};

function InlineDate({ row, field, onPatch }: { row: EnrichedRow; field: 'next_invoice_date' | 'last_invoice_date'; onPatch: PatchFn }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <input
      ref={ref}
      type="date"
      defaultValue={row[field] ?? ''}
      style={{ ...inpStyle, width: '130px', fontFamily: 'monospace', fontSize: '11px' }}
      onBlur={e => { if (e.target.value !== (row[field] ?? '')) onPatch(row.id, { [field]: e.target.value || null }); }}
    />
  );
}

function InlineText({ row, field, placeholder, width = '120px', onPatch }: { row: EnrichedRow; field: 'holvi_invoice_number' | 'notes'; placeholder?: string; width?: string; onPatch: PatchFn }) {
  return (
    <input
      type="text"
      defaultValue={row[field] ?? ''}
      placeholder={placeholder}
      style={{ ...inpStyle, width, fontSize: '12px' }}
      onBlur={e => { if (e.target.value !== (row[field] ?? '')) onPatch(row.id, { [field]: e.target.value.trim() || null }); }}
    />
  );
}

function InlinePrice({ row, onPatch }: { row: EnrichedRow; onPatch: PatchFn }) {
  return (
    <input
      type="number"
      min={0}
      defaultValue={row.price_eur}
      style={{ ...inpStyle, width: '70px', textAlign: 'right' }}
      onBlur={e => {
        const v = parseInt(e.target.value, 10);
        if (!isNaN(v) && v !== row.price_eur) onPatch(row.id, { price_eur: v });
      }}
    />
  );
}

function PeriodSelect({ row, onPatch }: { row: EnrichedRow; onPatch: PatchFn }) {
  return (
    <select
      defaultValue={row.billing_period}
      style={{ ...inpStyle, width: '100px' }}
      onChange={e => onPatch(row.id, { billing_period: e.target.value as TenantBillingRow['billing_period'] })}
    >
      <option value="monthly">Kuukausittain</option>
      <option value="annual">Vuosittain</option>
      <option value="one_time">Kertamaksu</option>
    </select>
  );
}

export default function BillingPage() {
  const { getToken } = useAuth();
  const [rows, setRows] = useState<TenantBillingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'actionable' | 'invoiced' | 'paid'>('actionable');
  const [saving, setSaving] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const data = await listBilling(token);
      setRows(data.rows);
    } catch {
      // tyhjä taulukko on parempi kuin ikuinen lataus
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function patch(tenantId: string, body: Parameters<typeof updateBilling>[2]) {
    setSaving(tenantId);
    try {
      const token = await getToken();
      if (!token) return;
      const updated = await updateBilling(token, tenantId, body);
      setRows(rs => rs.map(r => r.id === tenantId ? { ...r, ...updated } : r));
    } finally { setSaving(null); }
  }

  async function markInvoiced(row: TenantBillingRow) {
    const num = window.prompt('Holvi-laskunumero (tai tyhjä jos ei vielä):', '') ?? '';
    const next = row.billing_period === 'monthly'
      ? addMonths(today(), 1)
      : row.billing_period === 'annual' ? addMonths(today(), 12) : null;
    await patch(row.id, {
      billing_status: 'invoiced',
      holvi_invoice_number: num.trim() || null,
      last_invoice_date: today(),
      ...(next ? { next_invoice_date: next } : {}),
    });
  }

  function effectiveStatus(row: TenantBillingRow): TenantBillingRow['billing_status'] {
    if (row.billing_status !== 'not_due') return row.billing_status;
    if (isActive(row) && row.next_invoice_date && row.next_invoice_date <= today()) return 'due_now';
    return 'not_due';
  }

  const todayStr = today();
  const thisMonth = todayStr.slice(0, 7);

  const enriched: EnrichedRow[] = rows.map(r => ({ ...r, _eff: effectiveStatus(r) }));

  const actionable   = enriched.filter(r => r._eff === 'due_now' || r._eff === 'overdue');
  const overdue      = enriched.filter(r => r._eff === 'overdue');
  const invoiced     = enriched.filter(r => r._eff === 'invoiced');
  const paidMonth    = enriched.filter(r => r._eff === 'paid' && r.last_invoice_date?.startsWith(thisMonth));
  const mrr = enriched
    .filter(r => isActive(r) && r.price_eur > 0)
    .reduce((sum, r) => {
      if (r.billing_period === 'monthly') return sum + r.price_eur;
      if (r.billing_period === 'annual')  return sum + Math.round(r.price_eur / 12);
      return sum;
    }, 0);

  const filtered = enriched.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'actionable') return r._eff === 'due_now' || r._eff === 'overdue';
    if (filter === 'invoiced')   return r._eff === 'invoiced';
    if (filter === 'paid')       return r._eff === 'paid';
    return true;
  });

  const statCard = (label: string, value: number | string, color?: string) => (
    <div key={label} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '18px 20px' }}>
      <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--c-text-3)', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: color ?? 'var(--c-text-1)' }}>{value}</div>
    </div>
  );

  const btn = (label: string, onClick: () => void, color = 'var(--c-text-2)', disabled = false) => (
    <button onClick={onClick} disabled={disabled} style={{ fontSize: '11px', padding: '3px 8px', border: '1px solid var(--c-border)', borderRadius: '4px', background: 'var(--c-surface)', color, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap' }}>
      {label}
    </button>
  );

  if (loading) return <div style={{ color: 'var(--c-text-3)', fontSize: '14px', padding: '40px' }}>Ladataan...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600 }}>Laskutus</h1>
        <span style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>Manuaalinen seuranta · Holvi</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {statCard('Laskuta nyt', actionable.length, actionable.length ? 'var(--c-accent)' : undefined)}
        {statCard('Myöhässä', overdue.length, overdue.length ? 'var(--c-warn)' : undefined)}
        {statCard('Odottaa maksua', invoiced.length, invoiced.length ? '#d97706' : undefined)}
        {statCard('Maksettu tässä kuussa', paidMonth.length, paidMonth.length ? 'var(--c-ok)' : undefined)}
        {statCard('Arvioitu MRR', `${mrr} €`)}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {(['actionable', 'invoiced', 'paid', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ fontSize: '12px', fontWeight: 500, padding: '5px 12px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', background: filter === f ? 'var(--c-accent)' : 'var(--c-surface)', color: filter === f ? '#fff' : 'var(--c-text-2)', borderColor: filter === f ? 'var(--c-accent)' : 'var(--c-border)' }}>
            {{ actionable: 'Toimenpiteet', invoiced: 'Odottaa maksua', paid: 'Maksettu', all: 'Kaikki' }[f]}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--c-text-3)', alignSelf: 'center' }}>{filtered.length} tenantia</span>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>
                {['Tenant', 'Status', 'Hinta / €', 'Jakso', 'Seuraava lasku', 'Viim. lasku', 'Laskunro', 'Muistiinpanot', 'Toiminnot'].map(h => (
                  <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--c-text-3)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--c-text-3)' }}>Ei tuloksia tällä suodattimella.</td></tr>
              )}
              {filtered.map(row => {
                const isSaving = saving === row.id;
                const eff = row._eff;
                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--c-border-dim)', background: STATUS_BG[eff], opacity: isSaving ? 0.6 : 1 }}>
                    <td style={{ padding: '10px 12px', minWidth: '140px' }}>
                      <Link href={`/platform/tenants/${row.id}`} style={{ fontSize: '13px', fontWeight: 500, color: 'var(--c-text-1)', textDecoration: 'none' }}>{row.name}</Link>
                      <div style={{ fontSize: '10px', color: 'var(--c-text-3)', marginTop: '2px' }}>{row.plan} · {row.tenant_status}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <select
                        value={eff !== row.billing_status ? row.billing_status : eff}
                        onChange={e => patch(row.id, { billing_status: e.target.value as TenantBillingRow['billing_status'] })}
                        disabled={isSaving}
                        style={{ ...inpStyle, width: '130px', fontSize: '11px', fontWeight: 600, color: STATUS_COLOR[eff], border: `1px solid ${STATUS_COLOR[eff]}` }}
                      >
                        {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '10px 12px' }}><InlinePrice row={row} onPatch={patch} /></td>
                    <td style={{ padding: '10px 12px' }}><PeriodSelect row={row} onPatch={patch} /></td>
                    <td style={{ padding: '10px 12px' }}><InlineDate row={row} field="next_invoice_date" onPatch={patch} /></td>
                    <td style={{ padding: '10px 12px' }}><InlineDate row={row} field="last_invoice_date" onPatch={patch} /></td>
                    <td style={{ padding: '10px 12px' }}><InlineText row={row} field="holvi_invoice_number" placeholder="INV-xxx" width="90px" onPatch={patch} /></td>
                    <td style={{ padding: '10px 12px' }}><InlineText row={row} field="notes" placeholder="Muistiinpanot" width="140px" onPatch={patch} /></td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {(eff === 'due_now' || eff === 'overdue' || eff === 'not_due') &&
                          btn('Laskuta', () => markInvoiced(row), 'var(--c-accent)', isSaving)}
                        {eff === 'invoiced' &&
                          btn('Maksettu', () => patch(row.id, { billing_status: 'paid' }), 'var(--c-ok)', isSaving)}
                        {(eff === 'invoiced' || eff === 'due_now') &&
                          btn('Myöhässä', () => patch(row.id, { billing_status: 'overdue' }), 'var(--c-warn)', isSaving)}
                        {eff === 'paid' &&
                          btn('Nollaa', () => patch(row.id, { billing_status: 'not_due' }), 'var(--c-text-3)', isSaving)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
