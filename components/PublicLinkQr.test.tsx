import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PublicLinkQr, { publicPassportUrl } from './PublicLinkQr';

const API = 'https://api.digitaalinentuotepassi.tulkintatila.fi';

describe('publicPassportUrl', () => {
  it('encodes exactly `${API}/p/${slug}`', () => {
    expect(publicPassportUrl(API, 'esimerkki')).toBe(`${API}/p/esimerkki`);
  });
  it('returns null for a missing slug', () => {
    expect(publicPassportUrl(API, '')).toBeNull();
    expect(publicPassportUrl(API, '   ')).toBeNull();
    expect(publicPassportUrl(API, null)).toBeNull();
    expect(publicPassportUrl(API, undefined)).toBeNull();
  });
});

describe('PublicLinkQr — published product', () => {
  it('renders a QR code (canvas) for a valid public URL', () => {
    render(<PublicLinkQr apiBase={API} slug="esimerkki" />);
    expect(document.querySelector('canvas')).not.toBeNull();
  });

  it('shows the public URL, and it equals the encoded QR value', () => {
    render(<PublicLinkQr apiBase={API} slug="esimerkki" />);
    expect(screen.getByTestId('qr-url')).toHaveValue(`${API}/p/esimerkki`);
  });

  it('shows the copy button', () => {
    render(<PublicLinkQr apiBase={API} slug="esimerkki" />);
    expect(screen.getByRole('button', { name: 'Kopioi' })).toBeInTheDocument();
  });

  it('shows the "Lataa QR-koodi PNG-muodossa" button', () => {
    render(<PublicLinkQr apiBase={API} slug="esimerkki" />);
    expect(screen.getByRole('button', { name: /Lataa QR-koodi PNG-muodossa/i })).toBeInTheDocument();
  });
});

describe('PublicLinkQr — unpublished product', () => {
  it('does not render a QR when public_slug is missing', () => {
    render(<PublicLinkQr apiBase={API} slug="" />);
    expect(document.querySelector('canvas')).toBeNull();
    expect(screen.queryByRole('button', { name: /Lataa QR-koodi/i })).toBeNull();
  });

  it('shows a clear Finnish message that the product must be published first', () => {
    render(<PublicLinkQr apiBase={API} slug={null} />);
    expect(screen.getByTestId('qr-not-published')).toHaveTextContent(/Julkaise tuote ensin/i);
  });
});
