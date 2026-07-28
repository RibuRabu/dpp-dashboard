'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createNfcOrder, listNfcOrders, apiErrMsg, fmtDate, NfcOrder, NfcOrderInput } from '@/lib/api';
import { nfcStatusLabel, nfcTagTypeLabel, nfcStatusColor } from '@/lib/nfc-labels';

// Customer-facing card to order physical NFC tags pre-programmed to open this
// product's public passport. Secondary/optional relative to the QR code: the QR
// already works without any NFC tag. The public URL is shown read-only and is
// derived server-side — the customer never types it.

const inp: React.CSSProperties = { width: '100%', fontSize: '14px', color: 'var(--c-text-1)', background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '7px 10px', outline: 'none', fontFamily: 'inherit' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '11px', color: 'var(--c-text-3)', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: '6px' };

const QUANTITY_MAX = 10000;

// A small, EU-friendly country list; free entry not needed for the common case.
const COUNTRIES: { code: string; label: string }[] = [
  { code: 'FI', label: 'Suomi' }, { code: 'SE', label: 'Ruotsi' }, { code: 'NO', label: 'Norja' },
  { code: 'DK', label: 'Tanska' }, { code: 'EE', label: 'Viro' }, { code: 'DE', label: 'Saksa' },
  { code: 'FR', label: 'Ranska' }, { code: 'NL', label: 'Alankomaat' }, { code: 'ES', label: 'Espanja' },
  { code: 'IT', label: 'Italia' }, { code: 'PL', label: 'Puola' }, { code: 'LV', label: 'Latvia' },
  { code: 'LT', label: 'Liettua' },
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: '12px' }}><label style={lbl}>{label}</label>{children}</div>;
}

export default function NfcOrderCard({ slug, productName, apiBase, productActive }: {
  slug: string; productName: string; apiBase: string; productActive: boolean;
}) {
  const { getToken, orgId } = useAuth();
  const publicUrl = `${apiBase}/p/${slug}`;

  const [orders, setOrders] = useState<NfcOrder[]>([]);
  const [form, setForm] = useState<NfcOrderInput>({
    tag_type: 'standard', quantity: 100,
    recipient_name: '', company_name: '', address_line: '', postal_code: '', city: '', country_code: 'FI', customer_note: '',
  });
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [placed, setPlaced] = useState<NfcOrder | null>(null);
  const [placedUnpublished, setPlacedUnpublished] = useState(false);

  const loadOrders = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try { setOrders(await listNfcOrders(token, slug, orgId)); } catch { /* non-fatal */ }
  }, [getToken, slug, orgId]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const set = (k: keyof NfcOrderInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  // Front-end validation mirrors the server. Returns an error message or null.
  function validate(): string | null {
    const q = Number(form.quantity);
    if (!Number.isInteger(q) || q < 1 || q > QUANTITY_MAX) return 'Anna kelvollinen kappalemäärä (1–10000).';
    if (!form.recipient_name.trim()) return 'Vastaanottajan nimi on pakollinen.';
    if (!form.address_line.trim()) return 'Toimitusosoite on pakollinen.';
    if (!form.postal_code.trim()) return 'Postinumero on pakollinen.';
    if (!form.city.trim()) return 'Kaupunki on pakollinen.';
    if (!/^[A-Za-z]{2}$/.test(form.country_code)) return 'Valitse maa.';
    return null;
  }

  function toReview(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) { setErr(v); return; }
    setErr(null); setStep('review');
  }

  async function submit() {
    setSubmitting(true); setErr(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Kirjautuminen vaaditaan.');
      const body: NfcOrderInput = {
        tag_type: form.tag_type,
        quantity: Number(form.quantity),
        recipient_name: form.recipient_name.trim(),
        company_name: form.company_name?.trim() || undefined,
        address_line: form.address_line.trim(),
        postal_code: form.postal_code.trim(),
        city: form.city.trim(),
        country_code: form.country_code.toUpperCase(),
        customer_note: form.customer_note?.trim() || undefined,
      };
      const res = await createNfcOrder(token, slug, body, orgId);
      setPlaced(res.order);
      setPlacedUnpublished(res.product_unpublished);
      setStep('form');
      setForm(f => ({ ...f, recipient_name: '', company_name: '', address_line: '', postal_code: '', city: '', customer_note: '' }));
      loadOrders();
    } catch (e) {
      setErr(apiErrMsg(e));
    } finally { setSubmitting(false); }
  }

  const countryLabel = COUNTRIES.find(c => c.code === form.country_code)?.label ?? form.country_code;

  return (
    <div style={{ padding: '16px' }}>
      {/* What this is — and that it's optional */}
      <p style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: 1.6, marginBottom: '8px' }}>
        NFC-tunniste avaa saman julkisen tuotepassin kuin QR-koodi, kun asiakas koskettaa tunnistetta puhelimellaan.
        Voit tilata fyysisiä NFC-tunnisteita, jotka on ohjelmoitu valmiiksi tämän tuotteen tuotepassiin.
      </p>
      <p style={{ fontSize: '12px', color: 'var(--c-text-3)', lineHeight: 1.6, marginBottom: '14px' }}>
        QR-koodi toimii ilman NFC-tunnistetta. NFC on vapaaehtoinen lisätapa avata tuotepassi — voit tilata tunnisteita silloin, kun haluat.
      </p>

      {/* Target — read-only, derived server-side */}
      <div style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px' }}>
        <div style={{ fontSize: '10px', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '3px' }}>Ohjelmoitava tuote</div>
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--c-text-1)', marginBottom: '6px' }}>{productName}</div>
        <div style={{ fontSize: '10px', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '3px' }}>Tuotepassin osoite</div>
        <code style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--c-text-2)', wordBreak: 'break-all' }}>{publicUrl}</code>
      </div>

      {!productActive && (
        <div style={{ background: 'rgba(217,119,6,.07)', border: '1px solid rgba(217,119,6,.25)', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', fontSize: '12px', color: '#b45309', lineHeight: 1.6 }}>
          Tuotepassi ei ole vielä julkaistu. Voit silti tilata NFC-tunnisteet — tunniste alkaa toimia heti, kun julkaiset tuotepassin (Perustiedot → Julkaisun tila → Julkaistu).
        </div>
      )}

      {/* Confirmation of a just-placed order */}
      {placed && (
        <div style={{ background: 'rgba(21,128,61,.06)', border: '1px solid var(--c-ok)', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--c-ok)', marginBottom: '4px' }}>Tilauksesi on vastaanotettu.</div>
          <div style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: 1.7 }}>
            Tilausnumero: <strong style={{ fontFamily: 'monospace' }}>{placed.order_number}</strong><br />
            Tila: {nfcStatusLabel(placed.status)}
          </div>
          {placedUnpublished && (
            <div style={{ fontSize: '12px', color: 'var(--c-text-3)', marginTop: '6px' }}>Muista julkaista tuotepassi, jotta tunniste toimii.</div>
          )}
          <button onClick={() => setPlaced(null)} style={{ fontSize: '12px', color: 'var(--c-text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '8px' }}>Sulje</button>
        </div>
      )}

      {/* ── Order form ── */}
      {step === 'form' && (
        <form onSubmit={toReview}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Row label="NFC-tunnisteen tyyppi">
              <select style={inp} value={form.tag_type} onChange={set('tag_type')}>
                <option value="standard">{nfcTagTypeLabel('standard')}</option>
                <option value="on_metal">{nfcTagTypeLabel('on_metal')}</option>
              </select>
            </Row>
            <Row label="Kappalemäärä *">
              <input type="number" min={1} max={QUANTITY_MAX} step={1} style={inp} value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value === '' ? 0 : Number(e.target.value) }))} />
            </Row>
          </div>
          <Row label="Vastaanottajan nimi *"><input style={inp} value={form.recipient_name} onChange={set('recipient_name')} /></Row>
          <Row label="Yritys (valinnainen)"><input style={inp} value={form.company_name} onChange={set('company_name')} /></Row>
          <Row label="Toimitusosoite *"><input style={inp} value={form.address_line} onChange={set('address_line')} placeholder="Katuosoite" /></Row>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
            <Row label="Postinumero *"><input style={inp} value={form.postal_code} onChange={set('postal_code')} /></Row>
            <Row label="Kaupunki *"><input style={inp} value={form.city} onChange={set('city')} /></Row>
          </div>
          <Row label="Maa *">
            <select style={inp} value={form.country_code} onChange={set('country_code')}>
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </Row>
          <Row label="Viesti tilaukseen (valinnainen)">
            <textarea style={{ ...inp, minHeight: '64px', resize: 'vertical' }} value={form.customer_note} onChange={set('customer_note')} />
          </Row>

          <p style={{ fontSize: '12px', color: 'var(--c-text-3)', margin: '4px 0 12px' }}>Tilauksen hinta ja toimitus vahvistetaan erikseen.</p>
          {err && <p style={{ fontSize: '13px', color: 'var(--c-warn)', marginBottom: '10px', whiteSpace: 'pre-wrap' }}>{err}</p>}
          <button type="submit" style={{ background: 'var(--c-accent)', color: '#fff', fontSize: '14px', fontWeight: 500, padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
            Jatka yhteenvetoon
          </button>
        </form>
      )}

      {/* ── Review + confirm ── */}
      {step === 'review' && (
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-text-1)', marginBottom: '10px' }}>Tarkista tilaus</div>
          <div style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px', fontSize: '13px', color: 'var(--c-text-2)', lineHeight: 1.9 }}>
            <div><span style={{ color: 'var(--c-text-3)' }}>Tuote:</span> {productName}</div>
            <div><span style={{ color: 'var(--c-text-3)' }}>Tunnistetyyppi:</span> {nfcTagTypeLabel(form.tag_type)}</div>
            <div><span style={{ color: 'var(--c-text-3)' }}>Määrä:</span> {form.quantity} kpl</div>
            <div><span style={{ color: 'var(--c-text-3)' }}>Vastaanottaja:</span> {form.recipient_name}{form.company_name ? `, ${form.company_name}` : ''}</div>
            <div><span style={{ color: 'var(--c-text-3)' }}>Osoite:</span> {form.address_line}, {form.postal_code} {form.city}, {countryLabel}</div>
            {form.customer_note?.trim() && <div><span style={{ color: 'var(--c-text-3)' }}>Viesti:</span> {form.customer_note}</div>}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--c-text-3)', marginBottom: '12px' }}>Tilauksen hinta ja toimitus vahvistetaan erikseen.</p>
          {err && <p style={{ fontSize: '13px', color: 'var(--c-warn)', marginBottom: '10px', whiteSpace: 'pre-wrap' }}>{err}</p>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={submit} disabled={submitting} style={{ background: 'var(--c-accent)', color: '#fff', fontSize: '14px', fontWeight: 500, padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Lähetetään...' : 'Lähetä NFC-tilaus'}
            </button>
            <button onClick={() => { setStep('form'); setErr(null); }} disabled={submitting} style={{ fontSize: '14px', padding: '10px 16px', border: '1px solid var(--c-border)', borderRadius: '8px', background: 'var(--c-surface)', cursor: 'pointer', color: 'var(--c-text-2)' }}>
              Muokkaa
            </button>
          </div>
        </div>
      )}

      {/* ── This product's existing orders ── */}
      {orders.length > 0 && (
        <div style={{ marginTop: '20px', borderTop: '1px solid var(--c-border-dim)', paddingTop: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px' }}>Aiemmat NFC-tilaukset</div>
          {orders.map(o => {
            const c = nfcStatusColor(o.status);
            return (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid var(--c-border-dim)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--c-text-2)' }}>{o.order_number}</div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>{o.quantity} kpl · {nfcTagTypeLabel(o.tag_type)} · {fmtDate(o.created_at)}</div>
                  {o.tracking_code && (
                    <div style={{ fontSize: '12px', color: 'var(--c-text-3)', marginTop: '2px' }}>
                      Seuranta: {o.tracking_url
                        ? <a href={o.tracking_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-accent)' }}>{o.tracking_code}</a>
                        : <span style={{ fontFamily: 'monospace' }}>{o.tracking_code}</span>}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '999px', border: '1px solid', color: c.color, borderColor: c.borderColor }}>
                  {nfcStatusLabel(o.status)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
