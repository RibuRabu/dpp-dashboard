'use client';
import { useState } from 'react';
import { useAuth, useOrganization } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { createProduct, ApiError } from '@/lib/api';
import Link from 'next/link';

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--c-border-dim)' }}>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--c-text-3)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
        {label}{required && <span style={{ color: 'var(--c-accent)', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: '11px', color: 'var(--c-text-3)', marginTop: '5px' }}>{hint}</p>}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: '100%', fontSize: '14px', color: 'var(--c-text-1)',
  background: 'var(--c-surface-2)', border: '1px solid var(--c-border)',
  borderRadius: '6px', padding: '8px 10px', outline: 'none', fontFamily: 'inherit',
};

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--c-text-2)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '12px', color: 'var(--c-text-3)', marginTop: '2px' }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function apiErrMsg(e: unknown): string {
  if (e instanceof ApiError) {
    const body = e.body as { error?: string; limit?: number };
    const map: Record<string, string> = {
      no_active_organization: 'Ei aktiivista organisaatiota. Valitse organisaatio navipalkin vaihtajasta.',
      tenant_not_found: 'Organisaatiota ei löydy järjestelmästä. Ota yhteyttä tukeen.',
      product_limit_reached: `Tuoteraja (${body.limit ?? '?'} tuotetta) täynnä. Päivitä plan asetuksista.`,
      product_name_required: 'Tuotteen nimi on pakollinen.',
      unauthorized: 'Kirjautuminen vaaditaan.',
    };
    return map[body.error ?? ''] ?? `Virhe ${e.status}: ${JSON.stringify(e.body)}`;
  }
  return String(e);
}

export default function NewProductPage() {
  const { getToken } = useAuth();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({
    product_name: '', brand_name: '', manufacturer_name: '',
    manufacturer_email: '', manufacturer_address: '',
    product_type: '', identifier_level: 'model', data_carrier_type: 'qr',
    customer_name: '', customer_email: '', category_id: '',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!organization) { setErr('Ei aktiivista organisaatiota. Valitse organisaatio navipalkin vaihtajasta.'); return; }
    if (!form.product_name.trim()) { setErr('Tuotteen nimi on pakollinen.'); return; }
    setSaving(true); setErr('');
    try {
      const token = await getToken();
      if (!token) throw new Error('Ei kirjautumista');
      const { slug } = await createProduct(token, form);
      router.push(`/dashboard/products/${slug}`);
    } catch (e) {
      setErr(apiErrMsg(e));
      setSaving(false);
    }
  }

  if (!orgLoaded) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Link href="/dashboard/products" style={{ color: 'var(--c-text-3)', fontSize: '13px', textDecoration: 'none' }}>← Tuotteet</Link>
          <span style={{ color: 'var(--c-border)' }}>/</span>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--c-text-1)' }}>Uusi tuote</h1>
        </div>
        <div style={{ height: '40px', background: 'var(--c-surface-2)', borderRadius: '8px', opacity: 0.6 }} />
      </div>
    );
  }

  if (!organization) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Link href="/dashboard/products" style={{ color: 'var(--c-text-3)', fontSize: '13px', textDecoration: 'none' }}>← Tuotteet</Link>
          <span style={{ color: 'var(--c-border)' }}>/</span>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--c-text-1)' }}>Uusi tuote</h1>
        </div>
        <div style={{ background: 'rgba(196,40,42,.06)', border: '1px solid rgba(196,40,42,.2)', borderRadius: '10px', padding: '20px 24px' }}>
          <p style={{ color: 'var(--c-warn)', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Ei aktiivista organisaatiota</p>
          <p style={{ color: 'var(--c-warn)', fontSize: '13px' }}>Valitse organisaatio navipalkin vaihtajasta ennen tuotteen luomista.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link href="/dashboard/products" style={{ color: 'var(--c-text-3)', fontSize: '13px', textDecoration: 'none' }}>← Tuotteet</Link>
        <span style={{ color: 'var(--c-border)' }}>/</span>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--c-text-1)' }}>Uusi tuote</h1>
      </div>

      {/* Info box */}
      <div style={{ background: 'var(--c-accent-dim)', border: '1px solid rgba(10,109,194,.18)', borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', display: 'flex', gap: '10px' }}>
        <span style={{ fontSize: '16px', flexShrink: 0 }}>ℹ️</span>
        <div>
          <p style={{ fontSize: '13px', color: 'var(--c-accent)', fontWeight: 600, marginBottom: '3px' }}>Tuote luodaan luonnos-tilaan</p>
          <p style={{ fontSize: '12px', color: 'var(--c-text-2)' }}>Voit täydentää tiedot — materiaalit, hoito-ohjeet, kierrätysohjeet, käännökset — luomisen jälkeen tuotteen muokkaussivulla. Julkaise kun olet valmis.</p>
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card title="Perustiedot" subtitle="Tuotteen tunnistustiedot kuluttajille ja järjestelmille">
              <Field label="Tuotteen nimi" required hint="Näkyy kuluttajille tuotepassissa. Esim. 'Merinovillapaita Classic'.">
                <input style={inp} value={form.product_name} onChange={set('product_name')} placeholder="esim. Merinovillapaita Classic" required />
              </Field>
              <Field label="Brändi" hint="Brändin tai tuotemerkin nimi. Voi erota valmistajasta.">
                <input style={inp} value={form.brand_name} onChange={set('brand_name')} placeholder="esim. Luonto Design" />
              </Field>
              <Field label="Tuotetyyppi" hint="Vapaamuotoinen kategoriointi. Esim. 'Tekstiili – neulos', 'Elektroniikka'.">
                <input style={inp} value={form.product_type} onChange={set('product_type')} placeholder="esim. Tekstiili – neulos" />
              </Field>
            </Card>

            <Card title="Valmistaja" subtitle="EU ESPR -asetus edellyttää valmistajan tietoja tuotepassissa">
              <Field label="Valmistajan nimi">
                <input style={inp} value={form.manufacturer_name} onChange={set('manufacturer_name')} placeholder="esim. Luonto Tekstiilit Oy" />
              </Field>
              <Field label="Sähköposti">
                <input type="email" style={inp} value={form.manufacturer_email} onChange={set('manufacturer_email')} placeholder="info@valmistaja.fi" />
              </Field>
              <Field label="Osoite">
                <input style={inp} value={form.manufacturer_address} onChange={set('manufacturer_address')} placeholder="esim. Puistokatu 12, 00100 Helsinki" />
              </Field>
            </Card>

            <Card title="Asiakas (sisäinen tieto)" subtitle="Ei näy kuluttajille — vain hallintapaneelissa">
              <Field label="Asiakkaan nimi" hint="Kirjaa kuka tilasi tämän tuotepassin.">
                <input style={inp} value={form.customer_name} onChange={set('customer_name')} placeholder="esim. Luonto Tekstiilit Oy" />
              </Field>
              <Field label="Asiakkaan sähköposti">
                <input type="email" style={inp} value={form.customer_email} onChange={set('customer_email')} placeholder="asiakas@yritys.fi" />
              </Field>
            </Card>
          </div>

          <div>
            <Card title="EU-tunnisteet" subtitle="Vaaditaan ESPR-yhteensopivuuteen">
              <Field label="Tuoteluokka" hint="Ohjaa vaatimustenmukaisuussääntöjä. Voidaan muuttaa myöhemmin.">
                <select style={inp} value={form.category_id} onChange={set('category_id')}>
                  <option value="">Valitse luokka...</option>
                  <option value="cat_textiles">Tekstiilit ja vaatteet</option>
                  <option value="cat_electronics">Elektroniikka</option>
                  <option value="cat_batteries">Akut ja paristot</option>
                  <option value="cat_furniture">Huonekalut</option>
                  <option value="cat_other">Muu tuoteryhmä</option>
                </select>
              </Field>
              <Field label="Tunnistetaso" hint="model = tuotemalli (yleisin). batch = tuote-erä. item = yksittäinen tuote.">
                <select style={inp} value={form.identifier_level} onChange={set('identifier_level')}>
                  <option value="model">model — tuotemalli</option>
                  <option value="batch">batch — tuote-erä</option>
                  <option value="item">item — yksittäinen</option>
                </select>
              </Field>
              <Field label="Tiedonkantaja" hint="Miten kuluttaja lukee tuotepassin? Yleensä QR-koodi.">
                <select style={inp} value={form.data_carrier_type} onChange={set('data_carrier_type')}>
                  <option value="qr">QR-koodi</option>
                  <option value="nfc">NFC-siru</option>
                  <option value="rfid">RFID</option>
                  <option value="barcode">Viivakoodi</option>
                </select>
              </Field>
            </Card>

            <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '16px' }}>
              {err && (
                <div style={{ background: 'rgba(196,40,42,.06)', border: '1px solid rgba(196,40,42,.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px' }}>
                  <p style={{ color: 'var(--c-warn)', fontSize: '13px', fontWeight: 500 }}>Virhe</p>
                  <p style={{ color: 'var(--c-warn)', fontSize: '12px', marginTop: '3px' }}>{err}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={saving}
                style={{ width: '100%', background: saving ? '#7aabda' : 'var(--c-accent)', color: '#fff', fontSize: '14px', fontWeight: 600, padding: '11px', borderRadius: '8px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', transition: 'background .15s' }}
              >
                {saving ? 'Luodaan...' : 'Luo tuote →'}
              </button>
              <p style={{ fontSize: '11px', color: 'var(--c-text-3)', marginTop: '10px', textAlign: 'center', lineHeight: 1.5 }}>
                Tuote luodaan <strong>luonnos</strong>-tilaan.<br />Julkinen linkki aktivoituu vasta julkaisun jälkeen.
              </p>
            </div>

            {/* What happens next */}
            <div style={{ marginTop: '16px', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--c-text-3)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '10px' }}>Luomisen jälkeen voit</p>
              {['Lisätä materiaalit, hoito- ja kierrätysohjeet', 'Ladata PDF-dokumentteja (vaatimustenmukaisuus)', 'Lisätä käännökset muille kielille', 'Ladata QR-koodin fyysiselle tuotteelle', 'Jakaa omistajan muokkauslinkin'].map(s => (
                <div key={s} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '7px' }}>
                  <span style={{ color: 'var(--c-ok)', fontSize: '12px', flexShrink: 0, marginTop: '1px' }}>✓</span>
                  <span style={{ fontSize: '12px', color: 'var(--c-text-2)' }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
