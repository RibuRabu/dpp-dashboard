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
const norm = (s: string | null | undefined) => (s ?? '').replace(/\s/g, '');

function fillAddress() {
  fireEvent.change(screen.getByPlaceholderText('Katuosoite'), { target: { value: 'Testikatu 1' } });
  const setVal = (labelRe: RegExp, value: string) => {
    const el = screen.getByText(labelRe).parentElement!.querySelector('input')!;
    fireEvent.change(el, { target: { value } });
  };
  setVal(/Vastaanottajan nimi/i, 'Riikka');
  setVal(/Postinumero/i, '00100');
  setVal(/Kaupunki/i, 'Helsinki');
}

beforeEach(() => {
  createNfcOrder.mockReset();
  listNfcOrders.mockReset();
  listNfcOrders.mockResolvedValue([]);
});

describe('NfcOrderCard — Phase 7 commercial order', () => {
  it('offers exactly the two SKUs (NFC Mini, NFC Standard) as selectable options', async () => {
    render(<NfcOrderCard slug="esimerkki" productName="Merinovilla" apiBase={API} productActive />);
    // Product options are the only aria-pressed toggle buttons in the card.
    const options = (await screen.findAllByRole('button')).filter(b => b.hasAttribute('aria-pressed'));
    expect(options).toHaveLength(2);
    const names = options.map(b => norm(b.textContent));
    expect(names.some(n => n.includes('NFCMini'))).toBe(true);
    expect(names.some(n => n.includes('NFCStandard'))).toBe(true);
    // No On-Metal / PVC / epoxy SKU is offered as a selectable option.
    expect(names.some(n => /onmetal|pvc|epoksi/i.test(n))).toBe(false);
  });

  it('shows the 3,00 € unit price and that it includes programming + passport link', async () => {
    render(<NfcOrderCard slug="esimerkki" productName="Merinovilla" apiBase={API} productActive />);
    const prices = await screen.findAllByText((_, el) => norm(el?.textContent).includes('3,00€/kpl'));
    expect(prices.length).toBeGreaterThanOrEqual(2); // one per SKU card
    expect(screen.getByText(/Hinta sisältää ohjelmoinnin ja linkityksen/i)).toBeInTheDocument();
  });

  it('shows a live fi-FI total that updates with quantity', async () => {
    render(<NfcOrderCard slug="esimerkki" productName="Merinovilla" apiBase={API} productActive />);
    const line = await screen.findByTestId('nfc-total-line');
    expect(norm(line.textContent)).toBe('10×3,00€=30,00€');
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '20' } });
    expect(norm(screen.getByTestId('nfc-total-line').textContent)).toBe('20×3,00€=60,00€');
  });

  it('enforces the 10-piece minimum: disables submit and never calls the API', async () => {
    render(<NfcOrderCard slug="esimerkki" productName="Merinovilla" apiBase={API} productActive />);
    await screen.findByRole('button', { name: /NFC Standard/i });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } });
    const submit = screen.getByRole('button', { name: /Jatka yhteenvetoon/i });
    expect(submit).toBeDisabled();
    fireEvent.click(submit);
    expect(createNfcOrder).not.toHaveBeenCalled();
    expect(screen.getByText(/Minimitilaus on 10 kpl/i)).toBeInTheDocument();
  });

  it('explains the invoice-based process and shows the special-tags contact box', async () => {
    render(<NfcOrderCard slug="esimerkki" productName="Merinovilla" apiBase={API} productActive />);
    expect(await screen.findByText(/Saat laskun sähköpostiisi/i)).toBeInTheDocument();
    expect(screen.getByText(/Maksun jälkeen ohjelmoimme tunnisteet/i)).toBeInTheDocument();
    expect(screen.getByText(/Toimituskulut lisätään laskulle/i)).toBeInTheDocument();
    expect(screen.getByText(/5–7 arkipäivää/i)).toBeInTheDocument();
    expect(screen.getByText(/erikoisratkaisun/i)).toBeInTheDocument();
  });

  it('keeps the public URL read-only (customer never types it)', async () => {
    render(<NfcOrderCard slug="esimerkki" productName="Merinovilla" apiBase={API} productActive />);
    expect(await screen.findByText(`${API}/p/esimerkki`)).toBeInTheDocument();
    expect(screen.queryByDisplayValue(`${API}/p/esimerkki`)).toBeNull();
  });

  it('reviews then submits NFC Mini as tag_type on_metal, showing the order number', async () => {
    createNfcOrder.mockResolvedValue({
      order: { id: 'o1', order_number: 'NFC-2026-000007', status: 'new', quantity: 10, tag_type: 'on_metal', created_at: '2026-07-28', public_slug: 'esimerkki' },
      product_unpublished: false,
    });
    render(<NfcOrderCard slug="esimerkki" productName="Merinovilla" apiBase={API} productActive />);

    fireEvent.click(await screen.findByRole('button', { name: /NFC Mini/i }));
    fillAddress();
    fireEvent.click(screen.getByRole('button', { name: /Jatka yhteenvetoon/i }));

    // Review shows the total
    expect(await screen.findByText(/Tarkista tilaus/i)).toBeInTheDocument();
    expect(screen.getAllByText((_, el) => norm(el?.textContent) === '30,00€').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /Lähetä NFC-tilaus/i }));

    await waitFor(() => expect(createNfcOrder).toHaveBeenCalledTimes(1));
    const [, slugArg, body] = createNfcOrder.mock.calls[0];
    expect(slugArg).toBe('esimerkki');
    expect(body.tag_type).toBe('on_metal');   // NFC Mini -> backend slot
    expect(body.quantity).toBe(10);
    expect(body).not.toHaveProperty('tenant_id');
    expect(body).not.toHaveProperty('product_id');

    expect(await screen.findByText(/Tilauksesi on vastaanotettu/i)).toBeInTheDocument();
    expect(screen.getByText('NFC-2026-000007')).toBeInTheDocument();
  });
});
