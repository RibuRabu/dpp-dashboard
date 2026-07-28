import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────
const createNfcOrder = vi.fn();
const listNfcOrders = vi.fn();

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ getToken: async () => 'tok', orgId: 'org_1' }),
}));

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return {
    ...actual,
    createNfcOrder: (...a: unknown[]) => createNfcOrder(...a),
    listNfcOrders: (...a: unknown[]) => listNfcOrders(...a),
  };
});

import NfcOrderCard from './NfcOrderCard';

const API = 'https://api.digitaalinentuotepassi.tulkintatila.fi';

beforeEach(() => {
  createNfcOrder.mockReset();
  listNfcOrders.mockReset();
  listNfcOrders.mockResolvedValue([]);
});

describe('NfcOrderCard', () => {
  it('shows the read-only public passport URL derived from the slug (customer never types it)', async () => {
    render(<NfcOrderCard slug="esimerkki" productName="Merinovilla" apiBase={API} productActive />);
    expect(await screen.findByText(`${API}/p/esimerkki`)).toBeInTheDocument();
    // no editable input carries the URL
    expect(screen.queryByDisplayValue(`${API}/p/esimerkki`)).toBeNull();
  });

  it('renders the optional-NFC guidance and the price/delivery note', async () => {
    render(<NfcOrderCard slug="esimerkki" productName="Merinovilla" apiBase={API} productActive />);
    expect(screen.getByText(/NFC-tunniste avaa saman julkisen tuotepassin/i)).toBeInTheDocument();
    expect(screen.getByText(/QR-koodi toimii ilman NFC-tunnistetta/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Tilauksen hinta ja toimitus vahvistetaan erikseen/i).length).toBeGreaterThan(0);
  });

  it('warns when the product is not published', async () => {
    render(<NfcOrderCard slug="esimerkki" productName="Merinovilla" apiBase={API} productActive={false} />);
    expect(screen.getByText(/Tuotepassi ei ole vielä julkaistu/i)).toBeInTheDocument();
  });

  it('blocks the review step with a Finnish validation message when required fields are empty', async () => {
    render(<NfcOrderCard slug="esimerkki" productName="Merinovilla" apiBase={API} productActive />);
    fireEvent.click(screen.getByRole('button', { name: /Jatka yhteenvetoon/i }));
    expect(await screen.findByText(/Vastaanottajan nimi on pakollinen/i)).toBeInTheDocument();
    expect(createNfcOrder).not.toHaveBeenCalled();
  });

  it('shows a summary then submits with server-derived identity, showing the order number', async () => {
    createNfcOrder.mockResolvedValue({
      order: { id: 'o1', order_number: 'NFC-2026-000007', status: 'new', quantity: 100, tag_type: 'standard', created_at: '2026-07-28', public_slug: 'esimerkki' },
      product_unpublished: false,
    });
    render(<NfcOrderCard slug="esimerkki" productName="Merinovilla" apiBase={API} productActive />);

    fireEvent.change(screen.getByPlaceholderText('Katuosoite'), { target: { value: 'Testikatu 1' } });
    // fill required text inputs
    const setVal = (labelRe: RegExp, value: string) => {
      const el = screen.getByText(labelRe).parentElement!.querySelector('input')!;
      fireEvent.change(el, { target: { value } });
    };
    setVal(/Vastaanottajan nimi/i, 'Riikka');
    setVal(/Postinumero/i, '00100');
    setVal(/Kaupunki/i, 'Helsinki');

    fireEvent.click(screen.getByRole('button', { name: /Jatka yhteenvetoon/i }));

    // Review step: summary visible with the entered data
    expect(await screen.findByText(/Tarkista tilaus/i)).toBeInTheDocument();
    expect(screen.getByText(/Riikka/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Lähetä NFC-tilaus/i }));

    await waitFor(() => expect(createNfcOrder).toHaveBeenCalledTimes(1));
    // called with (token, slug, body, orgId) — body carries no tenant/product/url
    const [, slugArg, body] = createNfcOrder.mock.calls[0];
    expect(slugArg).toBe('esimerkki');
    expect(body).not.toHaveProperty('tenant_id');
    expect(body).not.toHaveProperty('product_id');
    expect(body).not.toHaveProperty('programming_url');

    expect(await screen.findByText(/Tilauksesi on vastaanotettu/i)).toBeInTheDocument();
    expect(screen.getByText('NFC-2026-000007')).toBeInTheDocument();
  });
});
