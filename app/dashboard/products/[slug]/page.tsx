'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProduct, updateProduct, deleteProduct, regenerateShareLink, getCompliance, parseJson, statusLabel, statusColor, fmtDate, Product, ComplianceResult, ApiError, NetworkError } from '@/lib/api';
import PublicLinkQr from '@/components/PublicLinkQr';
import VisibilityNote from '@/components/VisibilityNote';
import NfcOrderCard from '@/components/NfcOrderCard';
import { ruleLabel, regulationLabel } from '@/lib/compliance-labels';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';
const TABS = ['Perustiedot', 'Listat', 'Käännökset', 'Dokumentit', 'Jakaminen', 'EU-vaatimukset'] as const;
// Display labels only — internal tab keys above stay stable (ids, state, FIELD_TAB).
const TAB_LABELS: Record<string, string> = { Listat: 'Materiaalit ja ohjeet', Jakaminen: 'Jakaminen ja QR' };
// Human labels for the stored identifier level (values model/batch/item unchanged).
const IDENTIFIER_LABELS: Record<string, string> = { model: 'Tuotemalli', batch: 'Tuote-erä', item: 'Yksittäinen tuote' };

const FIELD_TAB: Record<string, typeof TABS[number]> = {
  product_name: 'Perustiedot', brand_name: 'Perustiedot', product_type: 'Perustiedot',
  manufacturer_name: 'Perustiedot', manufacturer_email: 'Perustiedot', manufacturer_address: 'Perustiedot',
  responsible_operator_name: 'Perustiedot', responsible_operator_email: 'Perustiedot', responsible_operator_address: 'Perustiedot',
  category_id: 'Perustiedot', target_markets_json: 'Perustiedot',
  materials_json: 'Listat', substances_json: 'Listat', care_instructions_json: 'Listat',
  repair_instructions_json: 'Listat', recycling_instructions_json: 'Listat', safety_notes_json: 'Listat',
  compliance_documents_json: 'Dokumentit',
  translations_json: 'Käännökset',
};

const CATEGORIES = [
  { id: 'cat_textiles',    label: 'Tekstiilit ja vaatteet' },
  { id: 'cat_electronics', label: 'Elektroniikka' },
  { id: 'cat_batteries',   label: 'Akut ja paristot' },
  { id: 'cat_furniture',   label: 'Huonekalut' },
  { id: 'cat_other',       label: 'Muu tuoteryhmä' },
];
const MARKETS = ['EU','FI','DE','FR','SE','EE','LV','LT','PL'];

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
  const { getToken, orgId } = useAuth();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('Perustiedot');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [shareUrl, setShareUrl] = useState('');

  // Form state
  const [basic, setBasic] = useState({ product_name: '', brand_name: '', manufacturer_name: '', manufacturer_email: '', manufacturer_address: '', responsible_operator_name: '', responsible_operator_email: '', responsible_operator_address: '', sku: '', gtin: '', batch_number: '', serial_number: '', product_type: '', status: 'draft', compliance_status: 'not_started', category_id: '', target_markets: ['EU'] as string[] });
  const [lists, setLists] = useState({ materials: [] as string[], substances: [] as string[], care_instructions: [] as string[], repair_instructions: [] as string[], recycling_instructions: [] as string[], safety_notes: [] as string[] });
  const [activeLang, setActiveLang] = useState('en');
  const [translations, setTranslations] = useState<Record<string, Record<string, unknown>>>({});
  const [docs, setDocs] = useState<{ name: string; url: string }[]>([]);
  const [compliance, setCompliance] = useState<ComplianceResult | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceError, setComplianceError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const p = await getProduct(token, slug, orgId);
      setProduct(p);
      setShareUrl(`${API}/owner/${p.owner_token}`);
      setBasic({ product_name: p.product_name ?? '', brand_name: p.brand_name ?? '', manufacturer_name: p.manufacturer_name ?? '', manufacturer_email: p.manufacturer_email ?? '', manufacturer_address: p.manufacturer_address ?? '', responsible_operator_name: p.responsible_operator_name ?? '', responsible_operator_email: p.responsible_operator_email ?? '', responsible_operator_address: p.responsible_operator_address ?? '', sku: p.sku ?? '', gtin: p.gtin ?? '', batch_number: p.batch_number ?? '', serial_number: p.serial_number ?? '', product_type: p.product_type ?? '', status: p.status, compliance_status: p.compliance_status ?? 'not_started', category_id: p.category_id ?? '', target_markets: parseJson(p.target_markets_json, ['EU']) });
      setLists({ materials: parseJson(p.materials_json, []), substances: parseJson(p.substances_json, []), care_instructions: parseJson(p.care_instructions_json, []), repair_instructions: parseJson(p.repair_instructions_json, []), recycling_instructions: parseJson(p.recycling_instructions_json, []), safety_notes: parseJson(p.safety_notes_json, []) });
      setTranslations(parseJson(p.translations_json, {}));
      setDocs(parseJson(p.compliance_documents_json, []));
    } catch (e) {
      if (e instanceof NetworkError) {
        setLoadError(`Verkkovirhe tai CORS-ongelma.\nURL: ${e.method} ${e.url}\nTarkista: CORS_ORIGIN (Worker) ja NEXT_PUBLIC_API_URL (Vercel).`);
      } else if (e instanceof ApiError && e.status === 404) {
        // product truly not found — loadError stays null, product stays null → shows "ei löytynyt"
      } else if (e instanceof ApiError) {
        setLoadError(`Palvelinvirhe ${e.status}: ${JSON.stringify(e.body)}`);
      } else {
        setLoadError(String(e));
      }
    } finally { setLoading(false); }
  }, [getToken, slug, orgId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  function markDirty() { dirtyRef.current = true; setDirty(true); }
  function clearDirty() { dirtyRef.current = false; setDirty(false); }

  async function fetchCompliance() {
    if (!product) return;
    setComplianceLoading(true);
    setComplianceError(null);
    try {
      const data = await getCompliance(product.product_uid);
      setCompliance(data);
    } catch (e) {
      setComplianceError(e instanceof ApiError ? `Tarkistus epäonnistui (virhe ${e.status})` : 'Tarkistus epäonnistui. Yritä uudelleen.');
    } finally { setComplianceLoading(false); }
  }

  async function save(body: Record<string, unknown>) {
    setSaving(true); setMsg(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Ei kirjautumista');
      const updated = await updateProduct(token, slug, body, orgId);
      setProduct(updated);
      clearDirty();
      setMsg({ type: 'ok', text: 'Tallennettu' });
      if (compliance) fetchCompliance();
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
      const res = await fetch(`${API}/api/tenant/product/${slug}/document`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, ...(orgId ? { 'X-Organization-Id': orgId } : {}) }, body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
      setDocs(d => [...d, { name: data.name, url: data.url }]);
      setMsg({ type: 'ok', text: 'Tiedosto ladattu' });
    } catch (e) { setMsg({ type: 'err', text: String(e) }); }
    finally { setSaving(false); e.target.value = ''; }
  }

  async function regen() {
    if (!confirm('Uuden muokkauslinkin luominen poistaa vanhan linkin käytöstä. Jatketaanko?')) return;
    setSaving(true); setMsg(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('');
      const r = await regenerateShareLink(token, slug, orgId);
      setShareUrl(`${API}${r.owner_url}`);
      setMsg({ type: 'ok', text: 'Uusi jakolinkki luotu' });
    } catch { setMsg({ type: 'err', text: 'Virhe' }); }
    finally { setSaving(false); }
  }

  async function archiveProduct() {
    if (!confirm('Arkistoidaanko tuote? Julkinen linkki piilottaa tuotteen.')) return;
    const token = await getToken();
    if (!token) return;
    await deleteProduct(token, slug, orgId);
    router.push('/dashboard/products');
  }

  if (loading) return <div style={{ color: 'var(--c-text-3)', fontSize: '14px', padding: '40px' }}>Ladataan...</div>;
  if (loadError) return (
    <div style={{ padding: '40px', maxWidth: '600px' }}>
      <div style={{ background: 'rgba(196,40,42,.06)', border: '1px solid rgba(196,40,42,.25)', borderRadius: '10px', padding: '16px 20px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-warn)', marginBottom: '8px' }}>Tuotteen lataus epäonnistui</p>
        {loadError.split('\n').map((line, i) => (
          <p key={i} style={{ fontSize: i === 0 ? '13px' : '11px', color: i === 0 ? 'var(--c-warn)' : 'var(--c-text-3)', fontFamily: i > 0 ? 'monospace' : 'inherit', marginTop: '3px', wordBreak: 'break-all' }}>{line}</p>
        ))}
      </div>
    </div>
  );
  if (!product) return <div style={{ color: 'var(--c-warn)', fontSize: '14px', padding: '40px' }}>Tuotetta ei löytynyt.</div>;

  const setBasicField = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { markDirty(); setBasic(b => ({ ...b, [k]: e.target.value })); };

  const transFor = (lang: string): Record<string, unknown> => translations[lang] || {};
  const setTrans = (lang: string, key: string, val: unknown) => { markDirty(); setTranslations(t => ({ ...t, [lang]: { ...(t[lang] || {}), [key]: val } })); };

  // Languages the backend actually stores (Worker SUPPORTED_LANGS). Other codes are
  // silently dropped on save, so the UI must not offer them.
  const LANGS = [
    { code: 'en', label: 'English' },
    { code: 'sv', label: 'Svenska' },
    { code: 'de', label: 'Deutsch' },
    { code: 'fr', label: 'Français' },
    { code: 'et', label: 'Eesti' },
    { code: 'lv', label: 'Latviešu' },
    { code: 'lt', label: 'Lietuvių' },
    { code: 'pl', label: 'Polski' },
  ];

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
      <div
        role="tablist"
        aria-label="Tuotteen osiot"
        style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--c-border)', marginBottom: '24px' }}
        onKeyDown={e => {
          const idx = TABS.indexOf(tab);
          if (e.key === 'ArrowRight') { const next = TABS[(idx + 1) % TABS.length]; setTab(next); setMsg(null); if (next === 'EU-vaatimukset') fetchCompliance(); }
          else if (e.key === 'ArrowLeft') { const prev = TABS[(idx - 1 + TABS.length) % TABS.length]; setTab(prev); setMsg(null); if (prev === 'EU-vaatimukset') fetchCompliance(); }
          else if (e.key === 'Home') { setTab(TABS[0]); setMsg(null); }
          else if (e.key === 'End') { const last = TABS[TABS.length - 1]; setTab(last); setMsg(null); if (last === 'EU-vaatimukset') fetchCompliance(); }
        }}
      >
        {TABS.map(t => (
          <button key={t}
            role="tab"
            aria-selected={tab === t}
            aria-controls={`tabpanel-${t}`}
            id={`tab-${t}`}
            tabIndex={tab === t ? 0 : -1}
            onClick={() => { setTab(t); setMsg(null); if (t === 'EU-vaatimukset') fetchCompliance(); }}
            style={{ fontSize: '13px', fontWeight: 500, padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: tab === t ? '2px solid var(--c-accent)' : '2px solid transparent', color: tab === t ? 'var(--c-accent)' : 'var(--c-text-2)', marginBottom: '-1px' }}>
            {TAB_LABELS[t] ?? t}
          </button>
        ))}
      </div>

      {dirty && !saving && (
        <div style={{ fontSize: '12px', color: '#d97706', background: 'rgba(217,119,6,.07)', border: '1px solid rgba(217,119,6,.25)', borderRadius: '6px', padding: '7px 12px', marginBottom: '12px' }}>
          Tallentamattomia muutoksia — muista tallentaa ennen poistumista.
        </div>
      )}
      {msg && <p style={{ fontSize: '13px', color: msg.type === 'ok' ? 'var(--c-ok)' : 'var(--c-warn)', marginBottom: '16px' }}>{msg.text}</p>}

      {/* ── Perustiedot ── */}
      {tab === 'Perustiedot' && (
        <form role="tabpanel" id="tabpanel-Perustiedot" aria-labelledby="tab-Perustiedot" onSubmit={saveBasic}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Card title="Tuotetiedot">
                <div style={{ padding: '10px 16px 0' }}><VisibilityNote scope="public" /></div>
                <div style={{ fontSize: '11px', color: 'var(--c-text-3)', padding: '6px 16px 0', lineHeight: 1.5 }}>Nimi, brändi ja tuotetyyppi näkyvät julkisessa tuotepassissa. Alla olevat tunnistenumerot (SKU, GTIN, erä- ja sarjanumero) ovat vain omaan käyttöösi.</div>
                <Field label="Tuotteen nimi *"><input required style={inp} value={basic.product_name} onChange={setBasicField('product_name')} /></Field>
                <Field label="Brändi"><input style={inp} value={basic.brand_name} onChange={setBasicField('brand_name')} /></Field>
                <Field label="Tuotetyyppi"><input style={inp} value={basic.product_type} onChange={setBasicField('product_type')} /></Field>
                <Field label="SKU"><input style={inp} value={basic.sku} onChange={setBasicField('sku')} /></Field>
                <Field label="GTIN / EAN"><input style={inp} value={basic.gtin} onChange={setBasicField('gtin')} /></Field>
                <Field label="Eränumero"><input style={inp} value={basic.batch_number} onChange={setBasicField('batch_number')} /></Field>
                <Field label="Sarjanumero"><input style={inp} value={basic.serial_number} onChange={setBasicField('serial_number')} /></Field>
              </Card>
              <Card title="Valmistaja">
                <div style={{ padding: '10px 16px 0' }}><VisibilityNote scope="public" /></div>
                <Field label="Nimi"><input style={inp} value={basic.manufacturer_name} onChange={setBasicField('manufacturer_name')} /></Field>
                <Field label="Sähköposti"><input type="email" style={inp} value={basic.manufacturer_email} onChange={setBasicField('manufacturer_email')} /></Field>
                <Field label="Osoite">
                  <input style={inp} value={basic.manufacturer_address} onChange={setBasicField('manufacturer_address')} placeholder="esim. Helsinki, Suomi" />
                  <p style={{ fontSize: '11px', color: 'var(--c-text-3)', marginTop: '4px' }}>Katuosoite ei ole pakollinen — kaupunki ja maa riittää (esim. Helsinki, Suomi). Tämä tieto näkyy julkisella tuotepassisivulla.</p>
                </Field>
              </Card>
              <Card title="Vastuullinen toimija (EU)">
                <div style={{ padding: '10px 16px 0' }}><VisibilityNote scope="public" /></div>
                <Field label="Nimi"><input style={inp} value={basic.responsible_operator_name} onChange={setBasicField('responsible_operator_name')} /></Field>
                <Field label="Sähköposti"><input type="email" style={inp} value={basic.responsible_operator_email} onChange={setBasicField('responsible_operator_email')} /></Field>
                <Field label="Osoite">
                  <input style={inp} value={basic.responsible_operator_address} onChange={setBasicField('responsible_operator_address')} placeholder="esim. Helsinki, Suomi" />
                  <p style={{ fontSize: '11px', color: 'var(--c-text-3)', marginTop: '4px' }}>GPSR edellyttää vastuullisen toimijan osoitteen. Kaupunki ja maa riittää yksityishenkilöille. Näkyy julkisella tuotepassisivulla.</p>
                </Field>
              </Card>
            </div>
            <div>
              <Card title="Julkaisu">
                <Field label="Julkaisun tila">
                  <select style={inp} value={basic.status} onChange={setBasicField('status')}>
                    <option value="draft">Luonnos</option>
                    <option value="active">Julkaistu</option>
                    <option value="archived">Arkistoitu</option>
                  </select>
                  <p style={{ fontSize: '11px', color: 'var(--c-text-3)', marginTop: '6px', lineHeight: 1.6 }}>
                    {basic.status === 'active'
                      ? 'Tuotepassi on julkinen ja sen QR-koodi sekä julkinen osoite toimivat.'
                      : basic.status === 'archived'
                      ? 'Tuotepassi on arkistoitu eikä näy julkisesti.'
                      : 'Tuotepassi ei näy julkisesti. Valitse Julkaistu ja tallenna, niin tuotepassi ja sen QR-koodi tulevat käyttöön.'}
                  </p>
                </Field>
                <Field label="EU-vaatimusten tila (ESPR)">
                  <select style={inp} value={basic.compliance_status} onChange={setBasicField('compliance_status')}>
                    <option value="not_started">Ei aloitettu</option>
                    <option value="in_progress">Kesken</option>
                    <option value="complete">Tiedot täydelliset</option>
                    <option value="verified">Varmennettu</option>
                  </select>
                </Field>
              </Card>
              <Card title="EU-luokitus">
                <Field label="Tuoteluokka">
                  <select style={inp} value={basic.category_id} onChange={setBasicField('category_id')}>
                    <option value="">Valitse luokka...</option>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </Field>
                <Field label="Kohdemarkkinat">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
                    {MARKETS.map(m => (
                      <label key={m} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--c-text-2)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={basic.target_markets.includes(m)}
                          onChange={e => { markDirty(); setBasic(b => ({
                            ...b,
                            target_markets: e.target.checked
                              ? [...b.target_markets, m]
                              : b.target_markets.filter(x => x !== m),
                          })); }}
                        />
                        {m}
                      </label>
                    ))}
                  </div>
                </Field>
              </Card>

              <details style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                <summary style={{ cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--c-text-2)', padding: '14px 16px' }}>Tekniset tiedot</summary>
                <div style={{ padding: '0 16px 6px' }}>
                  <div style={row}>
                    <div style={lbl}>Tunnistetaso</div>
                    <span style={{ fontSize: '13px', color: 'var(--c-text-2)' }}>{IDENTIFIER_LABELS[product.identifier_level] ?? product.identifier_level}</span>
                  </div>
                  <div style={row}>
                    <div style={lbl}>Julkinen tunniste</div>
                    <code style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--c-text-2)', wordBreak: 'break-all' }}>{product.public_slug}</code>
                  </div>
                  <div style={row}>
                    <div style={lbl}>Tuotteen tunniste</div>
                    <code style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--c-text-3)', wordBreak: 'break-all' }}>{product.product_uid}</code>
                  </div>
                  <div style={row}>
                    <div style={lbl}>Passin tunniste</div>
                    <code style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--c-text-3)', wordBreak: 'break-all' }}>{product.passport_uid}</code>
                  </div>
                </div>
              </details>
              <button type="submit" disabled={saving} style={{ width: '100%', background: 'var(--c-accent)', color: '#fff', fontSize: '14px', fontWeight: 500, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Tallennetaan...' : 'Tallenna'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── Listat ── */}
      {tab === 'Listat' && (
        <form role="tabpanel" id="tabpanel-Listat" aria-labelledby="tab-Listat" onSubmit={saveLists}>
          <div style={{ marginBottom: '16px' }}>
            <VisibilityNote scope="public" />
            <p style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: 1.6, marginTop: '8px', maxWidth: '640px' }}>
              Nämä tiedot auttavat asiakasta käyttämään, huoltamaan, korjaamaan ja kierrättämään tuotteen oikein.
              Ne näkyvät julkisessa tuotepassissa. Täytä ne kohdat, jotka tuotteellesi ovat oleellisia — esimerkit ovat vain esimerkkejä, eivät vaatimuksia.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {([['Materiaalit', 'materials', 'esim. 97% merinovilla'], ['Aineet / yhdisteet', 'substances', 'esim. REACH-yhteensopivat väriaineet'], ['Hoito-ohjeet', 'care_instructions', 'esim. Pese 30°C villaohjelma'], ['Korjausohjeet', 'repair_instructions', 'esim. Käytä villaneulan korjaussarjaa'], ['Kierrätysohjeet', 'recycling_instructions', 'esim. Toimita tekstiilikeräykseen'], ['Turvallisuustiedot', 'safety_notes', 'esim. Soveltuu sensitiiviselle iholle']] as [string, keyof typeof lists, string][]).map(([label, key, ph]) => (
              <Card key={key} title={label}>
                <div style={{ padding: '12px 16px' }}>
                  <ListEditor value={lists[key]} onChange={v => { markDirty(); setLists(l => ({ ...l, [key]: v })); }} placeholder={ph} />
                </div>
              </Card>
            ))}
          </div>
          <button type="submit" disabled={saving} style={{ background: 'var(--c-accent)', color: '#fff', fontSize: '14px', fontWeight: 500, padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Tallennetaan...' : 'Tallenna tiedot'}
          </button>
        </form>
      )}

      {/* ── Käännökset ── */}
      {tab === 'Käännökset' && (
        <form role="tabpanel" id="tabpanel-Käännökset" aria-labelledby="tab-Käännökset" onSubmit={saveTranslations}>
          <div style={{ marginBottom: '16px' }}>
            <VisibilityNote scope="public" />
            <p style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: 1.6, marginTop: '8px', maxWidth: '640px' }}>
              Lisää käännökset niille kielille, joita tarvitset tuotteen kohdemarkkinoilla. Kaikkia kieliä ei tarvitse
              täyttää. Käännökset näkyvät julkisessa tuotepassissa: asiakas voi lukea tuotepassin omalla kielellään.
            </p>
          </div>
          <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
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
        <div role="tabpanel" id="tabpanel-Dokumentit" aria-labelledby="tab-Dokumentit">
          <Card title="Tiedostot">
            <div style={{ padding: '12px 16px 0' }}>
              <VisibilityNote scope="private" />
              <p style={{ fontSize: '12px', color: 'var(--c-text-3)', marginTop: '8px', lineHeight: 1.6 }}>
                Tänne tallennetut tiedostot säilytetään omaa käyttöäsi ja vaatimustenmukaisuuden osoittamista varten.
                Niitä ei näytetä julkisessa tuotepassissa. Sopivia tiedostoja ovat esimerkiksi sertifikaatit,
                vaatimustenmukaisuusvakuutukset, testiraportit ja ohjeet. Tiedostot ovat vapaaehtoisia, ellei tuotteesi erikseen edellytä niitä.
              </p>
            </div>
            {docs.length === 0 && (
              <div style={{ padding: '4px 16px 16px', fontSize: '13px', color: 'var(--c-text-3)' }}>Ei vielä tiedostoja.</div>
            )}
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
        <div role="tabpanel" id="tabpanel-Jakaminen" aria-labelledby="tab-Jakaminen">
          {/* 1. Primary: the public passport + QR (works on its own) */}
          <Card title="🌐 Julkinen tuotepassi ja QR-koodi">
            <PublicLinkQr apiBase={API} slug={product.public_slug} />
          </Card>

          {/* 2. Secondary/optional: order physical NFC tags for the same passport */}
          <Card title="📱 Tilaa ohjelmoitu NFC-tunniste (valinnainen)">
            <NfcOrderCard
              slug={product.public_slug}
              productName={product.product_name}
              apiBase={API}
              productActive={product.status === 'active'}
            />
          </Card>

          {/* 3. Private: the owner/edit link — never share publicly */}
          <Card title="🔒 Muokkauslinkki">
            <div style={{ padding: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--c-warn)', marginBottom: '10px', lineHeight: 1.6, fontWeight: 500 }}>
                🔒 Älä jaa tätä linkkiä julkisesti. Linkin saanut henkilö voi päästä tuotteen omistajan näkymään ja muokata tuotetta.
              </p>
              <p style={{ fontSize: '13px', color: 'var(--c-text-2)', marginBottom: '10px', lineHeight: 1.6 }}>
                Jaa linkki vain henkilölle, jolle haluat antaa pääsyn tähän näkymään.
              </p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input readOnly style={{ ...inp, fontFamily: 'monospace', fontSize: '12px', flex: 1 }} value={shareUrl || `${API}/owner/${product.owner_token}`} onClick={e => (e.target as HTMLInputElement).select()} />
                <button type="button" onClick={() => navigator.clipboard.writeText(shareUrl || `${API}/owner/${product.owner_token}`)} style={{ fontSize: '12px', padding: '7px 12px', border: '1px solid var(--c-border)', borderRadius: '6px', background: 'var(--c-surface-2)', cursor: 'pointer', color: 'var(--c-text-2)' }}>Kopioi</button>
              </div>
              <button type="button" onClick={regen} disabled={saving} style={{ fontSize: '13px', color: 'var(--c-warn)', background: 'none', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '7px 12px', cursor: 'pointer' }}>
                Luo uusi muokkauslinkki
              </button>
              <p style={{ fontSize: '11px', color: 'var(--c-text-3)', marginTop: '6px' }}>Uuden muokkauslinkin luominen poistaa vanhan linkin käytöstä.</p>
            </div>
          </Card>

          {msg && <p style={{ fontSize: '13px', color: msg.type === 'ok' ? 'var(--c-ok)' : 'var(--c-warn)', marginTop: '8px' }}>{msg.text}</p>}
        </div>
      )}

      {/* ── EU-vaatimukset ── */}
      {tab === 'EU-vaatimukset' && (
        <div role="tabpanel" id="tabpanel-EU-vaatimukset" aria-labelledby="tab-EU-vaatimukset">
          {complianceLoading && (
            <p style={{ color: 'var(--c-text-3)', fontSize: '14px' }}>Tarkistetaan vaatimuksia...</p>
          )}

          {!complianceLoading && !compliance && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              {complianceError && (
                <p style={{ fontSize: '13px', color: 'var(--c-warn)', marginBottom: '12px', background: 'rgba(196,40,42,.06)', border: '1px solid rgba(196,40,42,.2)', borderRadius: '8px', padding: '10px 16px', display: 'inline-block' }}>
                  {complianceError}
                </p>
              )}
              {!complianceError && (
                <p style={{ fontSize: '13px', color: 'var(--c-text-2)', marginBottom: '16px', lineHeight: 1.6, maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto' }}>
                  EU-vaatimusten tarkistus käy läpi, mitä tietoja tuotepassistasi EU-vaatimukset edellyttävät —
                  esimerkiksi materiaalit, vastuullisen toimijan ja turvallisuustiedot — ja näyttää, mitä vielä puuttuu.
                  Jos jokin puuttuu, täydennä tiedot Perustiedot- ja Materiaalit ja ohjeet -välilehdillä ja tee tarkistus uudelleen.
                </p>
              )}
              <br />
              <button onClick={fetchCompliance} style={{ fontSize: '13px', padding: '8px 20px', background: 'var(--c-accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                {complianceError ? 'Yritä uudelleen' : 'Tarkista EU-vaatimukset'}
              </button>
            </div>
          )}

          {compliance && (
            <div>
              {/* 1. Mitä tarkistus tarkoittaa */}
              <div style={{ background: 'var(--c-accent-dim)', border: '1px solid rgba(10,109,194,.18)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--c-text-1)', marginBottom: '6px' }}>Mitä EU-vaatimusten tarkistus tarkoittaa?</div>
                <p style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: 1.6, margin: 0 }}>
                  Tarkistus käy tuotepassiin lisäämäsi tiedot läpi ja vertaa niitä tuotteelle valittuun tuoteluokkaan ja
                  markkina-alueeseen liittyviin EU-vaatimuksiin.
                </p>
                <p style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: 1.6, margin: '8px 0 0' }}>Näet tästä näkymästä:</p>
                <ul style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: 1.7, margin: '4px 0 0', paddingLeft: '18px' }}>
                  <li>mitkä tiedot ovat kunnossa</li>
                  <li>puuttuuko jotain, johon sinun pitää reagoida</li>
                  <li>mitkä asiat kannattaa vielä tarkistaa</li>
                </ul>
              </div>

              {/* 2. Main semantic status (no numeric score in the customer view) */}
              {(() => {
                const blocking = compliance.missing.length > 0;
                const autoPass = compliance.passed.length;
                const autoTotal = compliance.passed.length + compliance.missing.length;
                const review = compliance.warnings.length + compliance.info.length;
                return (
                  <div style={{ background: 'var(--c-surface)', border: '1px solid', borderColor: blocking ? '#d97706' : 'var(--c-ok)', borderRadius: '12px', padding: '20px 24px', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '22px', flexShrink: 0, lineHeight: 1.3 }}>{blocking ? '⚠️' : '✓'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--c-text-1)', marginBottom: '6px' }}>
                        {blocking ? 'Tuotepassissa on vielä täydennettävää' : 'Tuotepassin tiedot ovat kunnossa'}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: 1.7 }}>
                        {autoTotal > 0 && <div>{autoPass}/{autoTotal} automaattista tarkistusta täyttyy.</div>}
                        {blocking && <div>{compliance.missing.length} {compliance.missing.length === 1 ? 'kohta vaatii' : 'kohtaa vaatii'} toimenpiteen.</div>}
                        {review > 0 && <div>{review} {review === 1 ? 'asia' : 'asiaa'} kannattaa vielä tarkistaa.</div>}
                        {autoTotal === 0 && review === 0 && <div>Tälle tuotteelle ei ole toistaiseksi tarkistettavia kohtia.</div>}
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--c-text-3)', marginTop: '10px', marginBottom: 0, lineHeight: 1.5 }}>
                        Tarkistus perustuu tuotteelle valittuun tuoteluokkaan, markkina-alueeseen ja tuotepassiin syötettyihin tietoihin.
                      </p>
                    </div>
                    <button onClick={fetchCompliance} style={{ fontSize: '12px', padding: '7px 14px', border: '1px solid var(--c-border)', borderRadius: '8px', background: 'var(--c-surface-2)', cursor: 'pointer', color: 'var(--c-text-2)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      Päivitä tarkistus
                    </button>
                  </div>
                );
              })()}

              {/* No category note (informational, not alarming) */}
              {!compliance.category && (
                <div style={{ background: 'var(--c-accent-dim)', border: '1px solid rgba(10,109,194,.18)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: 'var(--c-text-2)', lineHeight: 1.6 }}>
                  Tuoteluokkaa ei ole vielä valittu, joten tarkistuksessa huomioidaan vain kaikkia tuotteita koskevat yleiset vaatimukset.
                  Valitse tuoteluokka Perustiedot-välilehdellä, niin tarkistus huomioi myös tuoteryhmäsi vaatimukset.
                </div>
              )}

              {/* 3. Vaatii toimenpiteen (blocking failures — severity error) */}
              {compliance.missing.length > 0 && (
                <Card title={`Vaatii toimenpiteen (${compliance.missing.length})`}>
                  {compliance.missing.map(m => (
                    <div key={m.rule_code} style={{ padding: '12px 16px', borderBottom: '1px solid var(--c-border-dim)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--c-warn)', fontSize: '12px', flexShrink: 0, marginTop: '2px' }}>●</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-text-1)', marginBottom: '3px' }}>{ruleLabel(m.rule_code)}</div>
                        <div style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: 1.5 }}>{m.message_fi}</div>
                        <div style={{ fontSize: '12px', color: 'var(--c-warn)', marginTop: '5px', fontWeight: 500 }}>Korjaa tämä tieto, jotta tuotepassi on täydellinen.</div>
                      </div>
                      {m.field && FIELD_TAB[m.field] && (
                        <button onClick={() => { setTab(FIELD_TAB[m.field!]); setMsg(null); window.scrollTo(0, 0); }} style={{ fontSize: '12px', color: 'var(--c-accent)', background: 'none', border: '1px solid var(--c-border)', borderRadius: '5px', padding: '3px 10px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          Korjaa →
                        </button>
                      )}
                    </div>
                  ))}
                </Card>
              )}

              {/* 4. Kannattaa vielä tarkistaa (non-blocking: warnings + info) */}
              {(compliance.warnings.length + compliance.info.length) > 0 && (
                <Card title={`Kannattaa vielä tarkistaa (${compliance.warnings.length + compliance.info.length})`}>
                  {[...compliance.warnings, ...compliance.info].map(w => (
                    <div key={w.rule_code} style={{ padding: '12px 16px', borderBottom: '1px solid var(--c-border-dim)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--c-text-3)', fontSize: '12px', flexShrink: 0, marginTop: '2px' }}>○</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-text-1)', marginBottom: '3px' }}>{ruleLabel(w.rule_code)}</div>
                        <div style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: 1.5 }}>{w.message_fi}</div>
                        <div style={{ fontSize: '12px', color: 'var(--c-text-3)', marginTop: '5px' }}>Tämä ei estä tuotepassin julkaisemista. Tarkista asia, jos se koskee tuotettasi.</div>
                      </div>
                      {w.field && FIELD_TAB[w.field] && (
                        <button onClick={() => { setTab(FIELD_TAB[w.field!]); setMsg(null); window.scrollTo(0, 0); }} style={{ fontSize: '12px', color: 'var(--c-text-2)', background: 'none', border: '1px solid var(--c-border)', borderRadius: '5px', padding: '3px 10px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          Täydennä →
                        </button>
                      )}
                    </div>
                  ))}
                </Card>
              )}

              {/* 5. Kunnossa (passed) */}
              {compliance.passed.length > 0 && (
                <Card title={`Kunnossa (${compliance.passed.length})`}>
                  <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {compliance.passed.map(p => (
                      <div key={p.rule_code} style={{ fontSize: '13px', color: 'var(--c-text-2)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ color: 'var(--c-ok)', flexShrink: 0 }}>✓</span>
                        {ruleLabel(p.rule_code)}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* 6. Mihin säädöksiin tarkistus perustuu? */}
              {compliance.regulations_applied.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--c-text-1)', marginBottom: '4px' }}>Mihin säädöksiin tarkistus perustuu?</div>
                  <p style={{ fontSize: '12px', color: 'var(--c-text-3)', lineHeight: 1.6, marginBottom: '10px', maxWidth: '620px' }}>Tuotteen luokan ja valittujen markkinoiden perusteella tarkistuksessa huomioidaan seuraavat EU-säädökset.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {compliance.regulations_applied.map(r => (
                      <div key={r.code} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '10px 14px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--c-text-1)', fontWeight: 500 }}>{regulationLabel(r.code, r.name)}</div>
                        <div style={{ fontSize: '11px', color: 'var(--c-text-3)', marginTop: '2px' }}>{r.code} {r.version}{r.status === 'draft' ? ' · luonnos' : ''}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. Subdued disclaimer */}
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--c-border-dim)', paddingTop: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--c-text-3)', marginBottom: '3px' }}>Tietoa tarkistuksesta</div>
                <p style={{ fontSize: '11px', color: 'var(--c-text-3)', lineHeight: 1.6, margin: 0, maxWidth: '620px' }}>
                  Tarkistus ei korvaa viranomaisen tai asiantuntijan tekemää vaatimustenmukaisuuden arviointia.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
