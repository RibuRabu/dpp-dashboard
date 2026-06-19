'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTenant, updateTenant, fmtDate, Tenant, ProductSummary, TenantUser, statusLabel, statusColor } from '@/lib/api';

export default function TenantPage() {
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const [data, setData] = useState<{ tenant: Tenant; products: ProductSummary[]; users: TenantUser[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [plan, setPlan] = useState('free');
  const [status, setStatus] = useState('trial');
  const [limit, setLimit] = useState(25);

  useEffect(() => {
    getToken().then(token => {
      if (!token) return;
      getTenant(token, id).then(d => {
        setData(d);
        setPlan(d.tenant.plan);
        setStatus(d.tenant.status);
        setLimit(d.tenant.product_limit);
      }).catch(() => {});
    });
  }, [getToken, id]);

  async function save() {
    setSaving(true); setMsg('');
    try {
      const token = await getToken();
      if (!token) throw new Error('');
      await updateTenant(token, id, { plan, status, product_limit: limit });
      setMsg('Tallennettu');
    } catch { setMsg('Virhe'); }
    finally { setSaving(false); }
  }

  if (!data) return <div style={{ color: 'var(--c-text-3)', padding: '40px', fontSize: '14px' }}>Ladataan...</div>;

  const { tenant, products, users } = data;
  const inp: React.CSSProperties = { fontSize: '14px', color: 'var(--c-text-1)', background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '7px 10px', outline: 'none' };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/platform/tenants" style={{ color: 'var(--c-text-3)', fontSize: '13px' }}>← Tenantit</Link>
        <h1 style={{ fontSize: '20px', fontWeight: 600 }}>{tenant.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {/* Products */}
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-text-3)', padding: '10px 16px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>Tuotteet ({products.length})</div>
            {products.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: '1px solid var(--c-border-dim)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{p.product_name}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--c-text-3)' }}>{p.public_slug}</div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '999px', border: '1px solid' }} className={statusColor(p.status)}>{statusLabel(p.status)}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--c-text-3)' }}>v{p.version}</span>
              </div>
            ))}
            {products.length === 0 && <div style={{ padding: '16px', fontSize: '13px', color: 'var(--c-text-3)' }}>Ei tuotteita.</div>}
          </div>

          {/* Users */}
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-text-3)', padding: '10px 16px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>Käyttäjät ({users.length})</div>
            {users.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: '1px solid var(--c-border-dim)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--c-text-2)' }}>{u.clerk_user_id}</div>
                  <div style={{ fontSize: '11px', color: 'var(--c-text-3)' }}>Liittyi {fmtDate(u.joined_at)}</div>
                </div>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', border: '1px solid var(--c-border)', color: 'var(--c-text-2)' }}>{u.role}</span>
              </div>
            ))}
            {users.length === 0 && <div style={{ padding: '16px', fontSize: '13px', color: 'var(--c-text-3)' }}>Ei käyttäjiä.</div>}
          </div>
        </div>

        {/* Settings */}
        <div>
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-text-3)', padding: '10px 16px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>Asetukset</div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--c-border-dim)' }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--c-text-3)', marginBottom: '6px' }}>PLAN</label>
              <select value={plan} onChange={e => setPlan(e.target.value)} style={{ ...inp, width: '100%' }}>
                <option value="free">free</option>
                <option value="starter">starter</option>
                <option value="pro">pro</option>
                <option value="enterprise">enterprise</option>
              </select>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--c-border-dim)' }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--c-text-3)', marginBottom: '6px' }}>STATUS</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inp, width: '100%' }}>
                <option value="trial">trial</option>
                <option value="active">active</option>
                <option value="suspended">suspended</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--c-border-dim)' }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--c-text-3)', marginBottom: '6px' }}>TUOTERAJA</label>
              <input type="number" min={0} max={10000} value={limit} onChange={e => setLimit(Number(e.target.value))} style={{ ...inp, width: '100%' }} />
            </div>
            <div style={{ padding: '16px' }}>
              {msg && <p style={{ fontSize: '12px', color: msg === 'Tallennettu' ? 'var(--c-ok)' : 'var(--c-warn)', marginBottom: '8px' }}>{msg}</p>}
              <button onClick={save} disabled={saving} style={{ width: '100%', background: 'var(--c-accent)', color: '#fff', fontSize: '14px', fontWeight: 500, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Tallennetaan...' : 'Tallenna'}
              </button>
            </div>
          </div>

          {/* Tenant info */}
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden', marginTop: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-text-3)', padding: '10px 16px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>Tunnisteet</div>
            {[['ID', tenant.id], ['Clerk Org', tenant.clerk_org_id], ['Slug', tenant.slug ?? '—'], ['Luotu', fmtDate(tenant.created_at)]].map(([k, v]) => (
              <div key={k} style={{ padding: '8px 16px', borderBottom: '1px solid var(--c-border-dim)' }}>
                <div style={{ fontSize: '10px', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{k}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--c-text-2)', wordBreak: 'break-all' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
