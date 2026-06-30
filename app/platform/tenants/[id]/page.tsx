'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTenant, updateTenant, fmtDate, Tenant, ProductSummary, TenantUser, statusLabel, statusColor, ApiError, adminCreateProductForTenant } from '@/lib/api';

export default function TenantPage() {
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const API = process.env.NEXT_PUBLIC_API_URL ?? '';
  const [data, setData] = useState<{ tenant: Tenant; products: ProductSummary[]; users: TenantUser[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [plan, setPlan] = useState('free');
  const [status, setStatus] = useState('trial');
  const [limit, setLimit] = useState(25);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState('');
  const [createOk, setCreateOk] = useState<string | null>(null);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

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

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true); setCreateErr(''); setCreateOk(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('');
      const result = await adminCreateProductForTenant(token, id, {
        product_name: newName.trim(),
        ...(newType.trim() ? { product_type: newType.trim() } : {}),
      });
      setCreateOk(result.public_slug);
      setNewName(''); setNewType('');
      setShowCreate(false);
      getTenant(token, id).then(d => setData(d)).catch(() => {});
    } catch (e) {
      if (e instanceof ApiError) {
        const body = e.body as { error?: string; limit?: number };
        if (body.error === 'product_limit_reached') setCreateErr(`Tuoteraja täynnä (${body.limit ?? '?'} tuotetta).`);
        else if (body.error === 'tenant_inactive') setCreateErr('Tenant ei ole aktiivinen tai trial-tilassa.');
        else setCreateErr(`Virhe: ${body.error ?? 'tuntematon'}`);
      } else {
        setCreateErr('Tuntematon virhe.');
      }
    } finally {
      setCreating(false);
    }
  }

  function copyOwnerLink(slug: string, token: string) {
    navigator.clipboard.writeText(`${API}/owner/${token}`).then(() => {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(s => s === slug ? null : s), 2000);
    });
  }

  async function save() {
    // Require explicit confirmation before archiving an active tenant
    if (status === 'archived' && data?.tenant.status !== 'archived' && !confirmingArchive) {
      setConfirmingArchive(true);
      return;
    }
    setConfirmingArchive(false);
    setSaving(true); setMsg('');
    try {
      const token = await getToken();
      if (!token) throw new Error('');
      await updateTenant(token, id, { plan, status, product_limit: limit });
      setMsg('Tallennettu');
      setData(d => d ? { ...d, tenant: { ...d.tenant, status, plan, product_limit: limit } } : d);
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>
              <span style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-text-3)' }}>Tuotteet ({products.length})</span>
              <button
                onClick={() => { setShowCreate(s => !s); setCreateErr(''); setCreateOk(null); }}
                style={{ fontSize: '12px', fontWeight: 500, padding: '4px 10px', background: 'var(--c-accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                + Luo tuote
              </button>
            </div>
            {createOk && (
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--c-border)', background: 'rgba(21,128,61,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--c-ok)', fontWeight: 500 }}>
                  Tuote luotu: <a href={`${API}/p/${createOk}`} target="_blank" rel="noreferrer" style={{ fontFamily: 'monospace', color: 'var(--c-ok)' }}>{createOk}</a>
                </span>
                <button onClick={() => setCreateOk(null)} style={{ fontSize: '12px', color: 'var(--c-text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
              </div>
            )}
            {showCreate && (
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--c-border)' }}>
                <form onSubmit={createProduct}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 200px' }}>
                      <label style={{ display: 'block', fontSize: '10px', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>Tuotteen nimi *</label>
                      <input required autoFocus style={inp} placeholder="esim. Merinovillapaita Classic" value={newName} onChange={e => setNewName(e.target.value)} />
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                      <label style={{ display: 'block', fontSize: '10px', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>Tuotetyyppi</label>
                      <input style={inp} placeholder="esim. Tekstiili" value={newType} onChange={e => setNewType(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: '6px', paddingBottom: '1px' }}>
                      <button type="submit" disabled={creating || !newName.trim()} style={{ fontSize: '13px', fontWeight: 500, padding: '7px 14px', background: 'var(--c-accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: creating || !newName.trim() ? 0.5 : 1 }}>
                        {creating ? 'Luodaan...' : 'Luo'}
                      </button>
                      <button type="button" onClick={() => { setShowCreate(false); setCreateErr(''); }} style={{ fontSize: '13px', padding: '7px 10px', border: '1px solid var(--c-border)', borderRadius: '6px', background: 'var(--c-surface)', cursor: 'pointer', color: 'var(--c-text-3)' }}>
                        Peruuta
                      </button>
                    </div>
                  </div>
                  {createErr && <p style={{ fontSize: '12px', color: 'var(--c-warn)', marginTop: '8px' }}>{createErr}</p>}
                </form>
              </div>
            )}
            {products.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: '1px solid var(--c-border-dim)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{p.product_name}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--c-text-3)' }}>{p.public_slug}</div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '999px', border: '1px solid' }} className={statusColor(p.status)}>{statusLabel(p.status)}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--c-text-3)' }}>v{p.version}</span>
                <a href={`${API}/p/${p.public_slug}`} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--c-accent)', whiteSpace: 'nowrap', textDecoration: 'none' }}>Avaa passi ↗</a>
                {p.owner_token && (
                  <a href={`${API}/owner/${p.owner_token}`} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--c-text-2)', whiteSpace: 'nowrap', textDecoration: 'none' }}>Muokkaa ↗</a>
                )}
                {p.owner_token && (
                  <button
                    onClick={() => copyOwnerLink(p.public_slug, p.owner_token!)}
                    style={{ fontSize: '12px', color: copiedSlug === p.public_slug ? 'var(--c-ok)' : 'var(--c-text-3)', whiteSpace: 'nowrap', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {copiedSlug === p.public_slug ? 'Kopioitu!' : 'Kopioi omistajalinkki'}
                  </button>
                )}
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
          {tenant.status === 'archived' && (
            <div style={{ background: 'rgba(196,40,42,.06)', border: '1px solid rgba(196,40,42,.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--c-warn)', marginBottom: '3px' }}>Tenant arkistoitu</p>
              <p style={{ fontSize: '11px', color: 'var(--c-text-2)' }}>Kaikki API-kutsut on estetty. Tuotteet ovat tallessa. Palauta asettamalla status trial tai active.</p>
            </div>
          )}
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
              <select value={status} onChange={e => { setStatus(e.target.value); setConfirmingArchive(false); }} style={{ ...inp, width: '100%' }}>
                <option value="trial">trial</option>
                <option value="active">active</option>
                <option value="suspended">suspended</option>
                <option value="inactive">inactive</option>
                <option value="archived">archived</option>
              </select>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--c-border-dim)' }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--c-text-3)', marginBottom: '6px' }}>TUOTERAJA</label>
              <input type="number" min={0} max={10000} value={limit} onChange={e => setLimit(Number(e.target.value))} style={{ ...inp, width: '100%' }} />
            </div>
            <div style={{ padding: '16px' }}>
              {confirmingArchive && (
                <div style={{ background: 'rgba(196,40,42,.06)', border: '1px solid rgba(196,40,42,.2)', borderRadius: '8px', padding: '12px 14px', marginBottom: '12px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--c-warn)', marginBottom: '4px' }}>Vahvista arkistointi</p>
                  <p style={{ fontSize: '11px', color: 'var(--c-text-2)', marginBottom: '10px' }}>
                    Estää kaikki API-kutsut välittömästi. Tuotteet säilyvät eikä mitään poisteta. Voit palauttaa tenantin milloin tahansa.
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={save} style={{ fontSize: '12px', fontWeight: 600, padding: '6px 14px', background: 'var(--c-warn)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                      Kyllä, arkistoi
                    </button>
                    <button onClick={() => { setConfirmingArchive(false); setStatus(data!.tenant.status); }} style={{ fontSize: '12px', padding: '6px 12px', border: '1px solid var(--c-border)', borderRadius: '6px', background: 'var(--c-surface)', cursor: 'pointer', color: 'var(--c-text-2)' }}>
                      Peruuta
                    </button>
                  </div>
                </div>
              )}
              {msg && <p style={{ fontSize: '12px', color: msg === 'Tallennettu' ? 'var(--c-ok)' : 'var(--c-warn)', marginBottom: '8px' }}>{msg}</p>}
              {!confirmingArchive && (
                <button onClick={save} disabled={saving} style={{ width: '100%', background: 'var(--c-accent)', color: '#fff', fontSize: '14px', fontWeight: 500, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Tallennetaan...' : 'Tallenna'}
                </button>
              )}
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
