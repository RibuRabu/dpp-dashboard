'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { listUnclaimed, listTenants, adminClaimProduct, fmtDate, ProductSummary, Tenant } from '@/lib/api';

export default function UnclaimedPage() {
  const { getToken } = useAuth();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');

  async function load(emailFilter?: string) {
    setLoading(true);
    const token = await getToken();
    if (!token) return;
    const [{ products: p }, { tenants: t }] = await Promise.all([
      listUnclaimed(token, emailFilter),
      listTenants(token, 0),
    ]);
    setProducts(p);
    setTenants(t);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function claim(slug: string) {
    const tid = selectedTenant[slug];
    if (!tid) { setMsg('Valitse tenant ensin'); return; }
    if (!confirm(`Yhdistetäänkö tuote "${slug}" tenantille?`)) return;
    setClaiming(slug); setMsg('');
    try {
      const token = await getToken();
      if (!token) throw new Error('');
      await adminClaimProduct(token, tid, slug);
      setProducts(ps => ps.filter(p => p.public_slug !== slug));
      setMsg('Yhdistetty');
    } catch { setMsg('Virhe'); }
    finally { setClaiming(null); }
  }

  const inp: React.CSSProperties = { fontSize: '13px', color: 'var(--c-text-1)', background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '7px 10px', outline: 'none' };

  return (
    <div>
      <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Lunastamattomia tuotteita ({products.length})</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <input style={{ ...inp, flex: 1 }} placeholder="Suodata asiakkaan sähköpostilla..." value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(email)} />
        <button onClick={() => load(email)} style={{ fontSize: '13px', padding: '7px 16px', border: '1px solid var(--c-border)', borderRadius: '6px', background: 'var(--c-surface)', cursor: 'pointer', color: 'var(--c-text-2)' }}>Hae</button>
        {email && <button onClick={() => { setEmail(''); load(); }} style={{ fontSize: '13px', padding: '7px 12px', border: '1px solid var(--c-border)', borderRadius: '6px', background: 'var(--c-surface)', cursor: 'pointer', color: 'var(--c-text-3)' }}>✕</button>}
      </div>

      {msg && <p style={{ fontSize: '13px', color: msg === 'Yhdistetty' ? 'var(--c-ok)' : 'var(--c-warn)', marginBottom: '12px' }}>{msg}</p>}

      {loading ? (
        <p style={{ color: 'var(--c-text-3)', fontSize: '14px' }}>Ladataan...</p>
      ) : (
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden' }}>
          {products.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid var(--c-border-dim)', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ fontWeight: 500, fontSize: '14px' }}>{p.product_name}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--c-text-3)' }}>{p.public_slug}</div>
                {(p as unknown as { customer_email?: string }).customer_email && (
                  <div style={{ fontSize: '11px', color: 'var(--c-text-3)' }}>{(p as unknown as { customer_email?: string }).customer_email}</div>
                )}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>{fmtDate(p.created_at)}</div>
              <select
                value={selectedTenant[p.public_slug] || ''}
                onChange={e => setSelectedTenant(s => ({ ...s, [p.public_slug]: e.target.value }))}
                style={{ ...inp, minWidth: '180px' }}
              >
                <option value="">Valitse tenant...</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button
                onClick={() => claim(p.public_slug)}
                disabled={claiming === p.public_slug || !selectedTenant[p.public_slug]}
                style={{ fontSize: '13px', fontWeight: 500, padding: '7px 14px', background: 'var(--c-accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: (claiming === p.public_slug || !selectedTenant[p.public_slug]) ? 0.5 : 1 }}
              >
                {claiming === p.public_slug ? '...' : 'Yhdistä'}
              </button>
            </div>
          ))}
          {products.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--c-text-3)' }}>Kaikki tuotteet on yhdistetty tenanteihin.</div>
          )}
        </div>
      )}
    </div>
  );
}
