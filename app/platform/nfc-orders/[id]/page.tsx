'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getAdminNfcOrder, updateNfcOrderStatus, apiErrMsg, fmtDate, NfcOrderAdmin } from '@/lib/api';
import { nfcStatusLabel, nfcTagTypeLabel, nfcStatusColor, nfcNextStatuses, NfcStatus } from '@/lib/nfc-labels';
import { formatEur, orderTotal, NFC_UNIT_PRICE_EUR } from '@/lib/nfc-catalog';

const inp: React.CSSProperties = { width: '100%', fontSize: '14px', color: 'var(--c-text-1)', background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '7px 10px', outline: 'none', fontFamily: 'inherit' };
const API = process.env.NEXT_PUBLIC_API_URL ?? '';

function Line({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--c-border-dim)' }}>
      <div style={{ fontSize: '10px', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{k}</div>
      <div style={{ fontSize: '13px', color: 'var(--c-text-2)', fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{v}</div>
    </div>
  );
}

export default function NfcOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const [order, setOrder] = useState<NfcOrderAdmin | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [pending, setPending] = useState<NfcStatus | null>(null);
  const [tracking, setTracking] = useState({ tracking_code: '', tracking_url: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const { order } = await getAdminNfcOrder(token, id);
      setOrder(order);
      setAdminNote(order.admin_note ?? '');
      setTracking({ tracking_code: order.tracking_code ?? '', tracking_url: order.tracking_url ?? '' });
    } catch (e) { setMsg({ type: 'err', text: apiErrMsg(e) }); }
  }, [getToken, id]);

  useEffect(() => { load(); }, [load]);

  async function applyStatus() {
    if (!pending) return;
    setSaving(true); setMsg(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Kirjautuminen vaaditaan.');
      const body: { status: string; admin_note?: string; tracking_code?: string; tracking_url?: string } = {
        status: pending,
        admin_note: adminNote.trim() || undefined,
      };
      if (pending === 'shipped') {
        body.tracking_code = tracking.tracking_code.trim() || undefined;
        body.tracking_url = tracking.tracking_url.trim() || undefined;
      }
      const { order } = await updateNfcOrderStatus(token, id, body);
      setOrder(order);
      setPending(null);
      setMsg({ type: 'ok', text: `Tila päivitetty: ${nfcStatusLabel(order.status)}` });
    } catch (e) { setMsg({ type: 'err', text: apiErrMsg(e) }); }
    finally { setSaving(false); }
  }

  if (!order) return <div style={{ color: 'var(--c-text-3)', padding: '40px', fontSize: '14px' }}>{msg?.type === 'err' ? msg.text : 'Ladataan...'}</div>;

  const c = nfcStatusColor(order.status);
  const nexts = nfcNextStatuses(order.status);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Link href="/platform/nfc-orders" style={{ color: 'var(--c-text-3)', fontSize: '13px' }}>← NFC-tilaukset</Link>
        <h1 style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'monospace' }}>{order.order_number}</h1>
        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', border: '1px solid', color: c.color, borderColor: c.borderColor }}>{nfcStatusLabel(order.status)}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        {/* Details */}
        <div>
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-text-3)', padding: '10px 16px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>Tilaus</div>
            <Line k="Tenant" v={order.tenant_name ?? order.tenant_id} />
            <Line k="Tuote" v={<>{order.product_name ?? '—'}{order.product_status ? ` (${order.product_status})` : ''}</>} />
            <Line k="Ohjelmoitava osoite" v={<a href={order.programming_url_snapshot} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-accent)' }}>{order.programming_url_snapshot}</a>} mono />
            <Line k="Julkinen tunniste" v={order.public_slug_snapshot} mono />
            <Line k="Tuotemalli" v={nfcTagTypeLabel(order.tag_type)} />
            <Line k="Määrä" v={`${order.quantity} kpl`} />
            <Line k="Kappalehinta" v={formatEur(NFC_UNIT_PRICE_EUR)} />
            <Line k="Kokonaishinta (ilman toimitusta)" v={formatEur(orderTotal(order.quantity))} />
          </div>

          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-text-3)', padding: '10px 16px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>Toimitus</div>
            <Line k="Vastaanottaja" v={order.recipient_name} />
            {order.company_name && <Line k="Yritys" v={order.company_name} />}
            <Line k="Osoite" v={`${order.address_line}, ${order.postal_code} ${order.city}, ${order.country_code}`} />
            {order.customer_note && <Line k="Asiakkaan viesti" v={order.customer_note} />}
            {(order.tracking_code || order.tracking_url) && (
              <Line k="Seuranta" v={order.tracking_url
                ? <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-accent)' }}>{order.tracking_code || order.tracking_url}</a>
                : order.tracking_code} mono />
            )}
          </div>

          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-text-3)', padding: '10px 16px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>Aikajana</div>
            <Line k="Luotu" v={fmtDate(order.created_at)} />
            {order.confirmed_at && <Line k="Vahvistettu" v={fmtDate(order.confirmed_at)} />}
            {order.programmed_at && <Line k="Ohjelmoitu" v={fmtDate(order.programmed_at)} />}
            {order.shipped_at && <Line k="Lähetetty" v={fmtDate(order.shipped_at)} />}
            {order.cancelled_at && <Line k="Peruttu" v={fmtDate(order.cancelled_at)} />}
          </div>
        </div>

        {/* Actions */}
        <div>
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-text-3)', padding: '10px 16px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>Toiminnot</div>
            <div style={{ padding: '14px 16px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--c-text-3)', marginBottom: '6px' }}>SISÄINEN MUISTIINPANO</label>
              <textarea style={{ ...inp, minHeight: '64px', resize: 'vertical', marginBottom: '4px' }} value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Ei näy asiakkaalle" />
              <p style={{ fontSize: '11px', color: 'var(--c-text-3)', marginBottom: '12px' }}>Tallentuu, kun päivität tilan. Ei näy asiakkaalle.</p>

              {nexts.length === 0 && (
                <p style={{ fontSize: '13px', color: 'var(--c-text-3)' }}>Tilaus on lopputilassa ({nfcStatusLabel(order.status)}). Ei jatkotoimia.</p>
              )}

              {nexts.length > 0 && !pending && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {nexts.map(s => (
                    <button key={s} onClick={() => { setPending(s); setMsg(null); }}
                      style={{
                        fontSize: '13px', fontWeight: 500, padding: '9px 12px', borderRadius: '8px', cursor: 'pointer', border: '1px solid',
                        ...(s === 'cancelled'
                          ? { color: 'var(--c-warn)', borderColor: 'rgba(196,40,42,.3)', background: 'var(--c-surface)' }
                          : { color: '#fff', borderColor: 'var(--c-accent)', background: 'var(--c-accent)' }),
                      }}>
                      Merkitse: {nfcStatusLabel(s)}
                    </button>
                  ))}
                </div>
              )}

              {pending && (
                <div style={{ marginTop: '4px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--c-text-1)', fontWeight: 600, marginBottom: '10px' }}>
                    Vahvista: {nfcStatusLabel(pending)}
                  </div>
                  {pending === 'shipped' && (
                    <>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--c-text-3)', marginBottom: '4px' }}>SEURANTAKOODI</label>
                      <input style={{ ...inp, marginBottom: '8px' }} value={tracking.tracking_code} onChange={e => setTracking(t => ({ ...t, tracking_code: e.target.value }))} placeholder="esim. JJFI..." />
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--c-text-3)', marginBottom: '4px' }}>SEURANTALINKKI</label>
                      <input style={{ ...inp, marginBottom: '10px' }} value={tracking.tracking_url} onChange={e => setTracking(t => ({ ...t, tracking_url: e.target.value }))} placeholder="https://..." />
                    </>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={applyStatus} disabled={saving} style={{ fontSize: '13px', fontWeight: 500, padding: '8px 16px', background: 'var(--c-accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                      {saving ? 'Tallennetaan...' : 'Vahvista'}
                    </button>
                    <button onClick={() => setPending(null)} disabled={saving} style={{ fontSize: '13px', padding: '8px 14px', border: '1px solid var(--c-border)', borderRadius: '8px', background: 'var(--c-surface)', cursor: 'pointer', color: 'var(--c-text-2)' }}>
                      Peruuta
                    </button>
                  </div>
                </div>
              )}

              {msg && <p style={{ fontSize: '12px', color: msg.type === 'ok' ? 'var(--c-ok)' : 'var(--c-warn)', marginTop: '10px', whiteSpace: 'pre-wrap' }}>{msg.text}</p>}
            </div>
          </div>

          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-text-3)', padding: '10px 16px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>Tunnisteet</div>
            <Line k="Order ID" v={order.id} mono />
            {order.product_status && (
              <div style={{ padding: '8px 16px' }}>
                <Link href={`${API}/p/${order.public_slug_snapshot}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: 'var(--c-accent)' }}>Avaa tuotepassi ↗</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
