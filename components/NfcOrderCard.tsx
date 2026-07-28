'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createNfcOrder, listNfcOrders, apiErrMsg, fmtDate, NfcOrder, NfcOrderInput } from '@/lib/api';
import { nfcStatusLabel, nfcTagTypeLabel, nfcStatusColor } from '@/lib/nfc-labels';
import {
  NFC_PRODUCTS, NFC_UNIT_PRICE_EUR, NFC_MIN_ORDER_QTY, NFC_MAX_ORDER_QTY,
  OrderableTagType, formatEur, orderTotal, orderTotalLine, nfcProductByTagType,
} from '@/lib/nfc-catalog';

// Customer-facing card to order physical NFC tags pre-programmed to open this
// product's public passport. Commercial order (invoice by email; no online
// payment in this phase). The public URL is derived server-side and shown
// read-only — the customer never types it.

const inp: React.CSSProperties = { width: '100%', fontSize: '14px', color: 'var(--c-text-1)', background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '9px 11px', outline: 'none', fontFamily: 'inherit' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '11px', color: 'var(--c-text-3)', letterSpacing: '.04em', marginBottom: '6px' };
const sectionTitle: React.CSSProperties = { fontSize: '13px', fontWeight: 600, color: 'var(--c-text-1)', marginBottom: '10px' };

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
  const [tagType, setTagType] = useState<OrderableTagType>('standard');
  const [quantity, setQuantity] = useState<number>(NFC_MIN_ORDER_QTY);
  const [addr, setAddr] = useState({ recipient_name: '', company_name: '', address_line: '', postal_code: '', city: '', country_code: 'FI', customer_note: '' });
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

  const setAddrField = (k: keyof typeof addr) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setAddr(a => ({ ...a, [k]: e.target.value }));

  const belowMinimum = quantity < NFC_MIN_ORDER_QTY;

  function validate(): string | null {
    if (!Number.isInteger(quantity) || quantity < NFC_MIN_ORDER_QTY) return `Minimitilaus on ${NFC_MIN_ORDER_QTY} kpl.`;
    if (quantity > NFC_MAX_ORDER_QTY) return `Enimmäismäärä on ${NFC_MAX_ORDER_QTY} kpl.`;
    if (!addr.recipient_name.trim()) return 'Vastaanottajan nimi on pakollinen.';
    if (!addr.address_line.trim()) return 'Toimitusosoite on pakollinen.';
    if (!addr.postal_code.trim()) return 'Postinumero on pakollinen.';
    if (!addr.city.trim()) return 'Kaupunki on pakollinen.';
    if (!/^[A-Za-z]{2}$/.test(addr.country_code)) return 'Valitse maa.';
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
        tag_type: tagType,
        quantity,
        recipient_name: addr.recipient_name.trim(),
        company_name: addr.company_name.trim() || undefined,
        address_line: addr.address_line.trim(),
        postal_code: addr.postal_code.trim(),
        city: addr.city.trim(),
        country_code: addr.country_code.toUpperCase(),
        customer_note: addr.customer_note.trim() || undefined,
      };
      const res = await createNfcOrder(token, slug, body, orgId);
      setPlaced(res.order);
      setPlacedUnpublished(res.product_unpublished);
      setStep('form');
      setAddr(a => ({ ...a, recipient_name: '', company_name: '', address_line: '', postal_code: '', city: '', customer_note: '' }));
      setQuantity(NFC_MIN_ORDER_QTY);
      loadOrders();
    } catch (e) {
      setErr(apiErrMsg(e));
    } finally { setSubmitting(false); }
  }

  const selected = nfcProductByTagType(tagType);
  const countryLabel = COUNTRIES.find(c => c.code === addr.country_code)?.label ?? addr.country_code;

  return (
    <div style={{ padding: '20px', maxWidth: '620px' }}>
      {/* What this is — and that it's optional */}
      <p style={{ fontSize: '14px', color: 'var(--c-text-2)', lineHeight: 1.6, marginBottom: '6px' }}>
        NFC-tunniste avaa saman julkisen tuotepassin kuin QR-koodi, kun asiakas koskettaa tunnistetta puhelimellaan.
        Tilaat valmiiksi ohjelmoidut tunnisteet — kiinnität ne tuotteeseen, siinä kaikki.
      </p>
      <p style={{ fontSize: '13px', color: 'var(--c-text-3)', lineHeight: 1.6, marginBottom: '20px' }}>
        QR-koodi toimii ilman NFC-tunnistetta. NFC on vapaaehtoinen lisätapa avata tuotepassi.
      </p>

      {/* Target — read-only, derived server-side */}
      <div style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px' }}>
        <div style={{ fontSize: '10px', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '3px' }}>Ohjelmoitava tuote</div>
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--c-text-1)', marginBottom: '8px' }}>{productName}</div>
        <div style={{ fontSize: '10px', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '3px' }}>Tuotepassin osoite</div>
        <code style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--c-text-2)', wordBreak: 'break-all' }}>{publicUrl}</code>
      </div>

      {!productActive && (
        <div style={{ background: 'rgba(217,119,6,.07)', border: '1px solid rgba(217,119,6,.25)', borderRadius: '10px', padding: '11px 14px', marginBottom: '20px', fontSize: '13px', color: '#b45309', lineHeight: 1.6 }}>
          Tuotepassi ei ole vielä julkaistu. Voit silti tilata tunnisteet — tunniste alkaa toimia heti, kun julkaiset tuotepassin (Perustiedot → Julkaisun tila → Julkaistu).
        </div>
      )}

      {/* Confirmation of a just-placed order */}
      {placed && (
        <div style={{ background: 'rgba(21,128,61,.06)', border: '1px solid var(--c-ok)', borderRadius: '12px', padding: '16px 18px', marginBottom: '20px' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--c-ok)', marginBottom: '6px' }}>Tilauksesi on vastaanotettu.</div>
          <div style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: 1.8 }}>
            Tilausnumero: <strong style={{ fontFamily: 'monospace' }}>{placed.order_number}</strong><br />
            Tila: {nfcStatusLabel(placed.status)}<br />
            Saat laskun sähköpostiisi. Ohjelmoimme ja postitamme tunnisteet maksun jälkeen.
          </div>
          {placedUnpublished && (
            <div style={{ fontSize: '12px', color: 'var(--c-text-3)', marginTop: '8px' }}>Muista julkaista tuotepassi, jotta tunniste toimii.</div>
          )}
          <button onClick={() => setPlaced(null)} style={{ fontSize: '12px', color: 'var(--c-text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '10px' }}>Sulje</button>
        </div>
      )}

      {/* ── Order form ── */}
      {step === 'form' && (
        <form onSubmit={toReview}>
          {/* 1. Product selection — two clean cards */}
          <div style={sectionTitle}>Valitse tunniste</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
            {NFC_PRODUCTS.map(p => {
              const active = tagType === p.tagType;
              return (
                <button key={p.tagType} type="button" onClick={() => setTagType(p.tagType)} aria-pressed={active}
                  style={{
                    textAlign: 'left', cursor: 'pointer', padding: '14px', borderRadius: '12px',
                    border: active ? '2px solid var(--c-accent)' : '1px solid var(--c-border)',
                    background: active ? 'var(--c-accent-dim)' : 'var(--c-surface)',
                    transition: 'border-color .12s, background .12s',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--c-text-1)' }}>{p.name}</span>
                    <span style={{ width: '16px', height: '16px', borderRadius: '999px', border: active ? '5px solid var(--c-accent)' : '1px solid var(--c-border)', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text-3)', lineHeight: 1.7, marginBottom: '8px' }}>
                    {p.chip} · {p.memory} · {p.diameter}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text-2)', lineHeight: 1.5, marginBottom: '10px' }}>{p.description}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--c-text-1)' }}>{formatEur(NFC_UNIT_PRICE_EUR)} / kpl</div>
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--c-text-3)', lineHeight: 1.6, marginBottom: '22px' }}>
            Hinta sisältää ohjelmoinnin ja linkityksen digitaaliseen tuotepassiin. Ei sisällä toimitusta.
          </p>

          {/* 2. Quantity + live total */}
          <div style={sectionTitle}>Määrä</div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
            <input type="number" min={NFC_MIN_ORDER_QTY} max={NFC_MAX_ORDER_QTY} step={1}
              style={{ ...inp, width: '120px' }} value={Number.isFinite(quantity) ? quantity : ''}
              onChange={e => setQuantity(e.target.value === '' ? 0 : Math.floor(Number(e.target.value)))} />
            <div data-testid="nfc-total-line" style={{ fontSize: '15px', color: 'var(--c-text-1)', fontWeight: 500 }}>{orderTotalLine(Math.max(quantity, 0))}</div>
          </div>
          <p style={{ fontSize: '12px', color: belowMinimum ? 'var(--c-warn)' : 'var(--c-text-3)', marginBottom: '22px' }}>
            Minimitilaus on {NFC_MIN_ORDER_QTY} kpl.
          </p>

          {/* 3. Delivery info */}
          <div style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '12px 14px', marginBottom: '22px' }}>
            <div style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: 1.7 }}>
              Toimituskulut lisätään laskulle.<br />
              Toimitusaika: 5–7 arkipäivää maksun vastaanottamisesta.
            </div>
          </div>

          {/* 4. Recipient / address */}
          <div style={sectionTitle}>Toimitustiedot</div>
          <Row label="Vastaanottajan nimi *"><input style={inp} value={addr.recipient_name} onChange={setAddrField('recipient_name')} /></Row>
          <Row label="Yritys (valinnainen)"><input style={inp} value={addr.company_name} onChange={setAddrField('company_name')} /></Row>
          <Row label="Toimitusosoite *"><input style={inp} value={addr.address_line} onChange={setAddrField('address_line')} placeholder="Katuosoite" /></Row>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
            <Row label="Postinumero *"><input style={inp} value={addr.postal_code} onChange={setAddrField('postal_code')} /></Row>
            <Row label="Kaupunki *"><input style={inp} value={addr.city} onChange={setAddrField('city')} /></Row>
          </div>
          <Row label="Maa *">
            <select style={inp} value={addr.country_code} onChange={setAddrField('country_code')}>
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </Row>
          <Row label="Viesti tilaukseen (valinnainen)">
            <textarea style={{ ...inp, minHeight: '64px', resize: 'vertical' }} value={addr.customer_note} onChange={setAddrField('customer_note')} />
          </Row>

          {/* 5. How ordering & payment works */}
          <div style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '14px 16px', margin: '10px 0 22px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--c-text-2)', marginBottom: '8px' }}>Näin tilaus etenee</div>
            <ol style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: 1.8, margin: 0, paddingLeft: '18px' }}>
              <li>Lähetä tilaus.</li>
              <li>Saat laskun sähköpostiisi.</li>
              <li>Maksun jälkeen ohjelmoimme tunnisteet.</li>
              <li>Tunnisteet postitetaan.</li>
            </ol>
          </div>

          {err && <p style={{ fontSize: '13px', color: 'var(--c-warn)', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>{err}</p>}
          <button type="submit" disabled={belowMinimum}
            style={{ background: belowMinimum ? 'var(--c-border)' : 'var(--c-accent)', color: '#fff', fontSize: '14px', fontWeight: 500, padding: '11px 26px', borderRadius: '10px', border: 'none', cursor: belowMinimum ? 'not-allowed' : 'pointer' }}>
            Jatka yhteenvetoon
          </button>
        </form>
      )}

      {/* ── Review + confirm ── */}
      {step === 'review' && selected && (
        <div>
          <div style={sectionTitle}>Tarkista tilaus</div>
          <div style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px', fontSize: '13px', color: 'var(--c-text-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>{selected.name} <span style={{ color: 'var(--c-text-3)' }}>({selected.diameter})</span></span>
              <span>{formatEur(NFC_UNIT_PRICE_EUR)} / kpl</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Määrä</span><span>{quantity} kpl</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 4px', marginTop: '4px', borderTop: '1px solid var(--c-border)', fontWeight: 600, color: 'var(--c-text-1)' }}>
              <span>Yhteensä (ilman toimitusta)</span><span>{formatEur(orderTotal(quantity))}</span>
            </div>
          </div>
          <div style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px', fontSize: '13px', color: 'var(--c-text-2)', lineHeight: 1.8 }}>
            <div><span style={{ color: 'var(--c-text-3)' }}>Tuote:</span> {productName}</div>
            <div><span style={{ color: 'var(--c-text-3)' }}>Vastaanottaja:</span> {addr.recipient_name}{addr.company_name ? `, ${addr.company_name}` : ''}</div>
            <div><span style={{ color: 'var(--c-text-3)' }}>Osoite:</span> {addr.address_line}, {addr.postal_code} {addr.city}, {countryLabel}</div>
            {addr.customer_note.trim() && <div><span style={{ color: 'var(--c-text-3)' }}>Viesti:</span> {addr.customer_note}</div>}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--c-text-3)', lineHeight: 1.6, marginBottom: '14px' }}>
            Toimituskulut lisätään laskulle. Saat laskun sähköpostiisi; ohjelmoimme ja postitamme tunnisteet maksun jälkeen (toimitusaika 5–7 arkipäivää maksusta).
          </p>
          {err && <p style={{ fontSize: '13px', color: 'var(--c-warn)', marginBottom: '10px', whiteSpace: 'pre-wrap' }}>{err}</p>}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={submit} disabled={submitting} style={{ background: 'var(--c-accent)', color: '#fff', fontSize: '14px', fontWeight: 500, padding: '11px 26px', borderRadius: '10px', border: 'none', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Lähetetään...' : 'Lähetä NFC-tilaus'}
            </button>
            <button onClick={() => { setStep('form'); setErr(null); }} disabled={submitting} style={{ fontSize: '14px', padding: '11px 18px', border: '1px solid var(--c-border)', borderRadius: '10px', background: 'var(--c-surface)', cursor: 'pointer', color: 'var(--c-text-2)' }}>
              Muokkaa
            </button>
          </div>
        </div>
      )}

      {/* ── Special tags — NOT part of the order ── */}
      <div style={{ marginTop: '24px', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '14px 16px' }}>
        <div style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: 1.6 }}>
          Tarvitsetko metallipinnalle soveltuvan tunnisteen, vedenkestävän tunnisteen tai muun erikoisratkaisun?{' '}
          <a href="mailto:tuki@digitaalinentuotepassi.fi" style={{ color: 'var(--c-accent)' }}>Ota yhteyttä.</a>
        </div>
      </div>

      {/* ── This product's existing orders ── */}
      {orders.length > 0 && (
        <div style={{ marginTop: '24px', borderTop: '1px solid var(--c-border-dim)', paddingTop: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px' }}>Aiemmat NFC-tilaukset</div>
          {orders.map(o => {
            const c = nfcStatusColor(o.status);
            return (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 0', borderBottom: '1px solid var(--c-border-dim)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--c-text-2)' }}>{o.order_number}</div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>{nfcTagTypeLabel(o.tag_type)} · {o.quantity} kpl · {formatEur(orderTotal(o.quantity))} · {fmtDate(o.created_at)}</div>
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
