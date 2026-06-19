'use client';
import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/lib/api';
import Link from 'next/link';

const field = (label: string, el: React.ReactNode) => (
  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--c-border-dim)' }}>
    <label style={{ display: 'block', fontSize: '11px', color: 'var(--c-text-3)', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</label>
    {el}
  </div>
);

const input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    style={{ width: '100%', fontSize: '14px', color: 'var(--c-text-1)', background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '7px 10px', outline: 'none' }}
  />
);

const select = (props: React.SelectHTMLAttributes<HTMLSelectElement>, children: React.ReactNode) => (
  <select
    {...props}
    style={{ width: '100%', fontSize: '14px', color: 'var(--c-text-1)', background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '7px 10px', outline: 'none' }}
  >
    {children}
  </select>
);

export default function NewProductPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({
    product_name: '', brand_name: '', manufacturer_name: '',
    manufacturer_email: '', manufacturer_address: '',
    product_type: '', identifier_level: 'model', data_carrier_type: 'qr',
    customer_name: '', customer_email: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.product_name.trim()) { setErr('Tuotteen nimi vaaditaan'); return; }
    setSaving(true); setErr('');
    try {
      const token = await getToken();
      if (!token) throw new Error('Ei kirjautumista');
      const { slug } = await createProduct(token, form);
      router.push(`/dashboard/products/${slug}`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Virhe');
      setSaving(false);
    }
  }

  const card = (title: string, children: React.ReactNode) => (
    <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
      <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-text-3)', padding: '10px 16px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/products" style={{ color: 'var(--c-text-3)', fontSize: '13px' }}>← Tuotteet</Link>
        <h1 style={{ fontSize: '20px', fontWeight: 600 }}>Uusi tuote</h1>
      </div>

      <form onSubmit={submit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            {card('Perustiedot', <>
              {field('Tuotteen nimi *', input({ value: form.product_name, onChange: e => set('product_name', e.target.value), placeholder: 'esim. Merinovillapaita Classic', required: true }))}
              {field('Brändi', input({ value: form.brand_name, onChange: e => set('brand_name', e.target.value) }))}
              {field('Tuotetyyppi', input({ value: form.product_type, onChange: e => set('product_type', e.target.value), placeholder: 'esim. Tekstiili – neulos' }))}
            </>)}

            {card('Valmistaja', <>
              {field('Valmistajan nimi', input({ value: form.manufacturer_name, onChange: e => set('manufacturer_name', e.target.value) }))}
              {field('Sähköposti', input({ type: 'email', value: form.manufacturer_email, onChange: e => set('manufacturer_email', e.target.value) }))}
              {field('Osoite', input({ value: form.manufacturer_address, onChange: e => set('manufacturer_address', e.target.value) }))}
            </>)}

            {card('Asiakas (sisäinen)', <>
              {field('Asiakkaan nimi', input({ value: form.customer_name, onChange: e => set('customer_name', e.target.value) }))}
              {field('Asiakkaan sähköposti', input({ type: 'email', value: form.customer_email, onChange: e => set('customer_email', e.target.value) }))}
            </>)}
          </div>

          <div>
            {card('Tunnisteet', <>
              {field('Tunnistetaso', select({ value: form.identifier_level, onChange: e => set('identifier_level', e.target.value) },
                <>
                  <option value="model">model — tuotemalli</option>
                  <option value="batch">batch — tuote-erä</option>
                  <option value="item">item — yksittäinen</option>
                </>
              ))}
              {field('Tiedonkantaja', select({ value: form.data_carrier_type, onChange: e => set('data_carrier_type', e.target.value) },
                <>
                  <option value="qr">QR-koodi</option>
                  <option value="nfc">NFC</option>
                  <option value="rfid">RFID</option>
                  <option value="barcode">Viivakoodi</option>
                </>
              ))}
            </>)}

            <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '16px' }}>
              {err && <p style={{ color: 'var(--c-warn)', fontSize: '13px', marginBottom: '12px' }}>{err}</p>}
              <button
                type="submit"
                disabled={saving}
                style={{ width: '100%', background: 'var(--c-accent)', color: '#fff', fontSize: '14px', fontWeight: 500, padding: '10px', borderRadius: '8px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Luodaan...' : 'Luo tuote'}
              </button>
              <p style={{ fontSize: '11px', color: 'var(--c-text-3)', marginTop: '8px', textAlign: 'center' }}>
                Tuote luodaan luonnos-tilaan. Voit julkaista sen myöhemmin.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
