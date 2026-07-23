'use client';

import { useCallback, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

// Builds the public passport URL a QR code must encode, or null when the product
// has no public address yet (unpublished). Exported for regression tests.
export function publicPassportUrl(apiBase: string, slug: string | null | undefined): string | null {
  const s = (slug ?? '').trim();
  if (!s) return null;
  return `${apiBase}/p/${s}`;
}

// Canvas is rendered at print resolution and scaled down for display, so the
// downloaded PNG is sharp enough to print. marginSize is the QR "quiet zone".
const QR_PRINT_PX = 1024;
const QR_DISPLAY_PX = 176;
const QR_QUIET_ZONE_MODULES = 4;

const inputStyle: React.CSSProperties = {
  fontFamily: 'monospace', fontSize: '12px', flex: 1,
  padding: '7px 10px', border: '1px solid var(--c-border)', borderRadius: '6px',
  background: 'var(--c-surface)', color: 'var(--c-text-1)', minWidth: 0,
};
const smallBtn: React.CSSProperties = {
  fontSize: '12px', padding: '7px 12px', border: '1px solid var(--c-border)',
  borderRadius: '6px', background: 'var(--c-surface-2)', cursor: 'pointer',
  color: 'var(--c-text-2)', textDecoration: 'none', whiteSpace: 'nowrap',
};

export default function PublicLinkQr({
  apiBase,
  slug,
}: {
  apiBase: string;
  slug: string | null | undefined;
}) {
  const url = publicPassportUrl(apiBase, slug);
  const wrapRef = useRef<HTMLDivElement>(null);

  const downloadPng = useCallback(() => {
    const canvas = wrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `tuotepassi-qr-${(slug ?? 'tuote').trim() || 'tuote'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [slug]);

  // Unpublished / no public address yet â€” never render a broken QR.
  if (!url) {
    return (
      <div style={{ padding: '16px' }}>
        <p data-testid="qr-not-published" style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: 1.6, margin: 0 }}>
          Julkaise tuote ensin, niin saat QR-koodin. QR-koodi vie tuotteen julkiseen
          tuotepassiin, joka nÃ¤kyy asiakkaille vasta julkaisun jÃ¤lkeen.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <p style={{ fontSize: '13px', color: 'var(--c-text-2)', marginBottom: '14px', lineHeight: 1.6 }}>
        Tulosta tÃ¤mÃ¤ QR-koodi tuotteeseen tai pakkaukseen. Asiakas nÃ¤kee tuotteen
        julkisen tuotepassin skannaamalla koodin puhelimella.
      </p>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div
          ref={wrapRef}
          style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid var(--c-border)', lineHeight: 0 }}
        >
          <QRCodeCanvas
            value={url}
            size={QR_PRINT_PX}
            marginSize={QR_QUIET_ZONE_MODULES}
            level="M"
            bgColor="#ffffff"
            fgColor="#000000"
            style={{ width: QR_DISPLAY_PX, height: QR_DISPLAY_PX }}
            title="Tuotepassin QR-koodi"
          />
        </div>

        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: '12px', color: 'var(--c-text-3)', marginBottom: '6px' }}>Julkinen osoite</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              readOnly
              data-testid="qr-url"
              value={url}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              style={inputStyle}
            />
            <button type="button" onClick={() => navigator.clipboard.writeText(url)} style={{ ...smallBtn, cursor: 'pointer' }}>
              Kopioi
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer" style={smallBtn}>â†—</a>
          </div>
          <button
            type="button"
            onClick={downloadPng}
            style={{
              fontSize: '13px', fontWeight: 600, padding: '10px 16px',
              border: '1px solid var(--c-accent)', borderRadius: '8px',
              background: 'var(--c-accent)', color: '#fff', cursor: 'pointer',
            }}
          >
            Lataa QR-koodi PNG-muodossa
          </button>
        </div>
      </div>
    </div>
  );
}
