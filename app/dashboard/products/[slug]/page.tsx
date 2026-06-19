'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProduct, updateProduct, deleteProduct, regenerateShareLink, parseJson, statusLabel, statusColor, fmtDate, Product, ApiError } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';
const TABS = ['Perustiedot', 'Listat', 'Käännökset', 'Dokumentit', 'Jakaminen'] as const;
type Tab = typeof TABS[number];

// ── Shared input styles ───────────────────────────────────────────────────────
const inp: React.CSSProperties = { width: '100%', fontSize: '14px', color: 'var(--c-text-1)', background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '7px 10px', outline: 'none', fontFamily: 'inherit' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '11px', color: 'var(--c-text-3)', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: '6px' };
const row: React.CSSProperties = { padding: '12px 16px', borderBottom: '1px solid var(--c-border-dim)' };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={row}><label style={lbl}>{label}</label>{children}</div>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
      <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-text-3)', padding: '10px 16px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>{title}</div>
      {children}
    </div>
  );
}

function ListEditor({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState(value.join('\n'));
  useEffect(() => { setText(value.join('\n')); }, [value]);
  return (
    <textarea
      style={{ ...inp, minHeight: '100px', resize: 'vertical' }}
      value={text}
      placeholder={placeholder ?? 'Yksi kohta per rivi'}
      onChange={e => { setText(e.target.value); onChange(e.target.value.split('\n').map(s => s.trim()).filter(Boolean)); }}
    />
  );
}

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { getToken } = useAuth();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('Perustiedot');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [shareUrl, setShareUrl] = useState('');

  // Form state
  const [basic, setBasic] = useState({ product_name: '', brand_name: '', manufacturer_name: '', manufacturer_email: '', manufacturer_address: '', responsible_operator_name: '', responsible_operator_email: '', responsible_operator_address: '', sku: '', gtin: '', batch_number: '', serial_number: '', product_type: '', status: 'draft' });
  const [lists, setLists] = useState({ materials: [] as string[], substances: [] as string[], care_instructions: [] as string[], repair_instructions: [] as string[], recycling_instructions: [] as string[], safety_notes: [] as string[] });
  const [activeLang, setActiveLang] = useState('en');
  const [translations, setTranslations] = useState<Record<string, Record<string, unknown>>>({});
  const [docs, setDocs] = useState<{ name: string; url: string }[]>([]);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const p = await getProduct(token, slug);
      setProduct(p);
      setShareUrl(`${window.location.origin.replace(':3000', '')}/owner/${p.owner_token}`);
      setBasic({ product_name: p.product_name ?? '', brand_name: p.brand_name ?? '', manufacturer_name: p.manufacturer_name ?? '', manufacturer_email: p.manufacturer_email ?? '', manufacturer_address: p.manufacturer_address ?? '', responsible_operator_name: p.responsible_operator_name ?? '', responsible_operator_email: p.responsible_operator_email ?? '', responsible_operator_address: p.responsible_operator_address ?? '', sku: p.sku ?? '', gtin: p.gtin ?? '', batch_number: p.batch_number ?? '', serial_number: p.serial_number ?? '', product_type: p.product_type ?? '', status: p.status });
      setLists({ materials: parseJson(p.materials_json, []), substances: parseJson(p.substances_json, []), care_instructions: parseJson(p.care_instructions_json, []), repair_instructions: parseJson(p.repair_instructions_json, []), recycling_instructions: parseJson(p.recycling_instructions_json, []), safety_notes: parseJson(p.safety_notes_json, []) });
      setTranslations(parseJson(p.translations_json, {}));
      setDocs(parseJson(p.compliance_documents_json, []));
    } catch { } finally { setLoading(false); }
  }, [getToken, slug]);

  useEffect(() => { load(); }, [load]);

  async function save(body: Record<string, unknown>) {
    setSaving(true); setMsg(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Ei kirjautumista');
      const updated = await updateProduct(token, slug, body);
      setProduct(updated);
      setMsg({ type: 'ok', text: 'Tallennettu' });
    } catch (e) {
      setMsg({ type: 'err', text: e instanceof ApiError ? JSON.stringify(e.body) : String(e) });
    } finally { setSaving(false); }
  }

  async function saveBasic(e: React.FormEvent) {
    e.preventDefault();
    await save({ ...basic, ...lists });
  }

  async function saveLists(e: React.FormEvent) {
    e.preventDefault();
    await save(lists);
  }

  async function saveTranslations(e: React.FormEvent) {
    e.preventDefault();
    await save({ translations });
  }

  async function uploadDoc(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setSaving(true); setMsg(null);
    try {
      const token = await getToken();
      const form = new FormData(); form.append('file', file);
      const res = await fetch(`${API}/api/tenant/product/${slug}/document`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
      setDocs(d => [...d, { name: data.name, url: data.url }]);
      setMsg({ type: 'ok', text: 'Tiedosto ladattu' });
    } catch (e) { setMsg({ type: 'err', text: String(e) }); }
    finally { setSaving(false); e.target.value = ''; }
  }

  async function regen() {
    if (!confirm('Uusi jakolinkki korvaa vanhan. Vanha QR/linkki lakkaa toimimasta. Jatketaan?')) return;
    setSaving(true); setMsg(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('');
      const r = await regenerateShareLink(token, slug);
      setShareUrl(`${API}${r.owner_url}`);
      setMsg({ type: 'ok', text: 'Uusi jakolinkki luotu' });
    } catch { setMsg({ type: 'err', text: 'Virhe' }); }
    finally { setSaving(false); }
  }

  async function archiveProduct() {
    if (!confirm('Arkistoidaanko tuote? Julkinen linkki piilottaa tuotteen.')) return;
    const token = await getToken();
    if (!token) return;
    await deleteProduct(token, slug);
    router.push('/dashboard/products');
  }

  if (loading) return <div style={{ color: 'var(--c-text-3)', fontSize: '14px', padding: '40px' }}>Ladataan...</div>;
  if (!product) return <div style={{ color: 'var(--c-warn)', fontSize: '14px', padding: '40px' }}>Tuotetta ei löytynyt.</div>;

  const setBasicField = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setBasic(b => ({ ...b, [k]: e.target.value }));

  const transFor = (lang: string): Record<string, unknown> => translations[lang] || {};
  const setTrans = (lang: string, key: string, val: unknown) => setTranslations(t => ({ ...t, [lang]: { ...(t[lang] || {}), [key]: val } }));

  const LANGS = [{ code: 'en', label: 'English' }, { code: 'sv', label: 'Svenska' }, { code: 'de', label: 'Deutsch' }, { code: 'fr', label: 'Français' }];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/products" style={{ color: 'var(--c-text-3)', fontSize: '13px' }}>← Tuotteet</Link>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 600 }}>{product.product_name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '999px', border: '1px solid' }} className={statusColor(product.status)}>{statusLabel(product.status)}</span>
            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--c-text-3)' }}>v{product.version}</span>
            <span style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>Päivitetty {fmtDate(product.updated_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={`${API}/p/${product.public_slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: 'var(--c-accent)' }}>Julkinen ↗</a>
          <button onClick={archiveProduct} style={{ fontSize: '12px', color: 'var(--c-warn)', background: 'none', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer' }}>Arkistoi</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--c-border)', marginBottom: '24px' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); setMsg(null); }}
            style={{ fontSize: '13px', fontWeight: 500, padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: tab === t ? '2px solid var(--c-accent)' : '2px solid transparent', color: tab === t ? 'var(--c-accent)' : 'var(--c-text-2)', marginBottom: '-1px' }}>
            {t}
          </button>
        ))}
      </div>

      {msg && <p style={{ fontSize: '13px', color: msg.type === 'ok' ? 'var(--c-ok)' : 'var(--c-warn)', marginBottom: '16px' }}>{msg.text}</p>}

      {/* ── Perustiedot ── */}
      {tab === 'Perustiedot' && (
        <form onSubmit={saveBasic}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Card title="Tuotetiedot">
                <Field label="Tuotteen nimi *"><input required style={inp} value={basic.product_name} onChange={setBasicField('product_name')} /></Field>
                <Field label="Brändi"><input style={inp} value={basic.brand_name} onChange={setBasicField('brand_name')} /></Field>
                <Field label="Tuotetyyppi"><input style={inp} value={basic.product_type} onChange={setBasicField('product_type')} /></Field>
                <Field label="SKU"><input style={inp} value={basic.sku} onChange={setBasicField('sku')} /></Field>
                <Field label="GTIN / EAN"><input style={inp} value={basic.gtin} onChange={setBasicField('gtin')} /></Field>
                <Field label="Eränumero"><input style={inp} value={basic.batch_number} onChange={setBasicField('batch_number')} /></Field>
                <Field label="Sarjanumero"><input style={inp} value={basic.serial_number} onChange={setBasicField('serial_number')} /></Field>
              </Card>
              <Card title="Valmistaja">
                <Field label="Nimi"><input style={inp} value={basic.manufacturer_name} onChange={setBasicField('manufacturer_name')} /></Field>
                <Field label="Sähköposti"><input type="email" style={inp} value={basic.manufacturer_email} onChange={setBasicField('manufacturer_email')} /></Field>
                <Field label="Osoite"><input style={inp} value={basic.manufacturer_address} onChange={setBasicField('manufacturer_address')} /></Field>
              </Card>
              <Card title="Vastuullinen operaattori (EU)">
                <Field label="Nimi"><input style={inp} value={basic.responsible_operator_name} onChange={setBasicField('responsible_operator_name')} /></Field>
                <Field label="Sähköposti"><input type="email" style={inp} value={basic.responsible_operator_email} onChange={setBasicField('responsible_operator_email')} /></Field>
                <Field label="Osoite"><input style={inp} value={basic.responsible_operator_address} onChange={setBasicField('responsible_operator_address')} /></Field>
              </Card>
            </div>
            <div>
              <Card title="Tila">
                <Field label="Tila">
                  <select style={inp} value={basic.status} onChange={setBasicField('status')}>
                    <option value="draft">Luonnos</option>
                    <option value="active">Julkaistu</option>
                    <option value="archived">Arkistoitu</option>
                  </select>
                </Field>
              </Card>
              <Card title="Tunnisteet">
                <div style={row}>
                  <div style={lbl}>product_uid</div>
                  <code style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--c-accent)', wordBreak: 'break-all' }}>{product.product_uid}</code>
                </div>
                <div style={row}>
                  <div style={lbl}>passport_uid</div>
                  <code style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--c-accent)', wordBreak: 'break-all' }}>{product.passport_uid}</code>
                </div>
                <div style={row}>
                  <div style={lbl}>public_slug</div>
                  <code style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--c-text-2)' }}>{product.public_slug}</code>
                </div>
                <div style={row}>
                  <div style={lbl}>identifier_level</div>
                  <code style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--c-text-2)' }}>{product.identifier_level}</code>
                </div>
              </Card>
              <button type="submit" disabled={saving} style={{ width: '100%', background: 'var(--c-accent)', color: '#fff', fontSize: '14px', fontWeight: 500, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Tallennetaan...' : 'Tallenna'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── Listat ── */}
      {tab === 'Listat' && (
        <form onSubmit={saveLists}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {([['Materiaalit', 'materials', 'esim. 97% merinovilla'], ['Aineet / yhdisteet', 'substances', 'esim. REACH-yhteensopivat väriaineet'], ['Hoito-ohjeet', 'care_instructions', 'esim. Pese 30°C villaohjelma'], ['Korjausohjeet', 'repair_instructions', 'esim. Käytä villaneulan korjaussarjaa'], ['Kierrätysohjeet', 'recycling_instructions', 'esim. Toimita tekstiilikeräykseen'], ['Turvallisuustiedot', 'safety_notes', 'esim. Soveltuu sensitiiviselle iholle']] as [string, keyof typeof lists, string][]).map(([label, key, ph]) => (
              <Card key={key} title={label}>
                <div style={{ padding: '12px 16px' }}>
                  <ListEditor value={lists[key]} onChange={v => setLists(l => ({ ...l, [key]: v }))} placeholder={ph} />
                </div>
              </Card>
            ))}
          </div>
          <button type="submit" disabled={saving} style={{ background: 'var(--c-accent)', color: '#fff', fontSize: '14px', fontWeight: 500, padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Tallennetaan...' : 'Tallenna listat'}
          </button>
        </form>
      )}

      {/* ── Käännökset ── */}
      {tab === 'Käännökset' && (
        <form onSubmit={saveTranslations}>
          <div className="flex gap-2 mb-4">
            {LANGS.map(l => (
              <button key={l.code} type="button" onClick={() => setActiveLang(l.code)}
                style={{ fontSize: '12px', fontWeight: 500, padding: '5px 12px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', background: activeLang === l.code ? 'var(--c-accent)' : 'var(--c-surface)', color: activeLang === l.code ? '#fff' : 'var(--c-text-2)', borderColor: activeLang === l.code ? 'var(--c-accent)' : 'var(--c-border)' }}>
                {l.label}
              </button>
            ))}
          </div>
          <Card title={`Käännökset — ${LANGS.find(l => l.code === activeLang)?.label}`}>
            <Field label="Tuotteen nimi"><input style={inp} value={String(transFor(activeLang).product_name ?? '')} onChange={e => setTrans(activeLang, 'product_name', e.target.value)} placeholder={product.product_name} /></Field>
            <Field label="Brändi"><input style={inp} value={String(transFor(activeLang).brand_name ?? '')} onChange={e => setTrans(activeLang, 'brand_name', e.target.value)} placeholder={product.brand_name ?? ''} /></Field>
            <Field label="Tuotetyyppi"><input style={inp} value={String(transFor(activeLang).product_type ?? '')} onChange={e => setTrans(activeLang, 'product_type', e.target.value)} placeholder={product.product_type ?? ''} /></Field>
            <Field label="Materiaalit"><ListEditor value={(transFor(activeLang).materials as string[]) || []} onChange={v => setTrans(activeLang, 'materials', v)} placeholder={parseJson(product.materials_json, []).join('\n')} /></Field>
            <Field label="Hoito-ohjeet"><ListEditor value={(transFor(activeLang).care_instructions as string[]) || []} onChange={v => setTrans(activeLang, 'care_instructions', v)} /></Field>
            <Field label="Korjausohjeet"><ListEditor value={(transFor(activeLang).repair_instructions as string[]) || []} onChange={v => setTrans(activeLang, 'repair_instructions', v)} /></Field>
            <Field label="Kierrätysohjeet"><ListEditor value={(transFor(activeLang).recycling_instructions as string[]) || []} onChange={v => setTrans(activeLang, 'recycling_instructions', v)} /></Field>
            <Field label="Turvallisuustiedot"><ListEditor value={(transFor(activeLang).safety_notes as string[]) || []} onChange={v => setTrans(activeLang, 'safety_notes', v)} /></Field>
          </Card>
          <button type="submit" disabled={saving} style={{ background: 'var(--c-accent)', color: '#fff', fontSize: '14px', fontWeight: 500, padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Tallennetaan...' : 'Tallenna käännökset'}
          </button>
        </form>
      )}

      {/* ── Dokumentit ── */}
      {tab === 'Dokumentit' && (
        <div>
          <Card title="Tiedostot">
            {docs.length === 0 && <div style={{ padding: '16px', fontSize: '13px', color: 'var(--c-text-3)' }}>Ei tiedostoja.</div>}
            {docs.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: '1px solid var(--c-border-dim)' }}>
                <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '12px', color: 'var(--c-text-2)', wordBreak: 'break-all' }}>{d.name}</span>
                <a href={`${API}${d.url}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--c-accent)' }}>Avaa</a>
              </div>
            ))}
            <div style={{ padding: '16px', borderTop: docs.length ? '1px solid var(--c-border)' : 'none' }}>
              <label style={lbl}>Lisää tiedosto (PDF, JPG, PNG, max 10 MB)</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={uploadDoc} disabled={saving}
                style={{ fontSize: '13px', color: 'var(--c-text-2)', background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '7px 10px', width: '100%' }} />
            </div>
          </Card>
        </div>
      )}

      {/* ── Jakaminen ── */}
      {tab === 'Jakaminen' && (
        <div>
          <Card title="Julkinen linkki">
            <div style={{ padding: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--c-text-2)', marginBottom: '10px' }}>Tämä linkki on stabiili — QR-koodit osoittavat tähän.</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input readOnly style={{ ...inp, fontFamily: 'monospace', fontSize: '12px', flex: 1 }} value={`${API}/p/${product.public_slug}`} onClick={e => (e.target as HTMLInputElement).select()} />
                <button type="button" onClick={() => navigator.clipboard.writeText(`${API}/p/${product.public_slug}`)} style={{ fontSize: '12px', padding: '7px 12px', border: '1px solid var(--c-border)', borderRadius: '6px', background: 'var(--c-surface-2)', cursor: 'pointer', color: 'var(--c-text-2)' }}>Kopioi</button>
                <a href={`${API}/p/${product.public_slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', padding: '7px 12px', border: '1px solid var(--c-border)', borderRadius: '6px', background: 'var(--c-surface-2)', color: 'var(--c-text-2)', textDecoration: 'none' }}>↗</a>
              </div>
            </div>
          </Card>

          <Card title="Jakolinkki (omistajan näkymä)">
            <div style={{ padding: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--c-text-2)', marginBottom: '10px' }}>Tällä linkillä pääsee muokkaamaan tuotetta ilman kirjautumista. Voidaan uusia, jolloin vanha lakkaa toimimasta.</p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input readOnly style={{ ...inp, fontFamily: 'monospace', fontSize: '12px', flex: 1 }} value={shareUrl || `${API}/owner/${product.owner_token}`} onClick={e => (e.target as HTMLInputElement).select()} />
                <button type="button" onClick={() => navigator.clipboard.writeText(shareUrl || `${API}/owner/${product.owner_token}`)} style={{ fontSize: '12px', padding: '7px 12px', border: '1px solid var(--c-border)', borderRadius: '6px', background: 'var(--c-surface-2)', cursor: 'pointer', color: 'var(--c-text-2)' }}>Kopioi</button>
              </div>
              <button type="button" onClick={regen} disabled={saving} style={{ fontSize: '13px', color: 'var(--c-warn)', background: 'none', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '7px 12px', cursor: 'pointer' }}>
                ↺ Luo uusi jakolinkki
              </button>
            </div>
          </Card>

          {msg && <p style={{ fontSize: '13px', color: msg.type === 'ok' ? 'var(--c-ok)' : 'var(--c-warn)', marginTop: '8px' }}>{msg.text}</p>}
        </div>
      )}
    </div>
  );
}
