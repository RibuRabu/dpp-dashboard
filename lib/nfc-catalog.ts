// NFC product catalogue — the single source of truth for what a customer can
// order, the price, the minimum order, and the display name of every tag type.
// Presentation/commerce only; there is no payment integration in this phase.
//
// tag_type is now the REAL product model (Phase 7.5): the dashboard sends 'mini'
// or 'standard' directly — no translation layer, no fake mapping. 'on_metal'
// (Metallitunniste) is a known type used by historical/future orders; it is not
// offered as an orderable SKU yet, but it has a display label so admin views
// render it correctly.

export const NFC_UNIT_PRICE_EUR = 3.0;   // € per tag — same for both SKUs
export const NFC_MIN_ORDER_QTY = 10;     // minimum tags per order
export const NFC_MAX_ORDER_QTY = 10000;  // upper bound (mirrors the Worker)

// Every tag type the backend can hold. Keep in sync with the Worker's NFC_TAG_TYPES.
export type NfcTagTypeValue = 'mini' | 'standard' | 'on_metal';
// The subset a customer can actually order today.
export type OrderableTagType = 'mini' | 'standard';

// Single label map for all tag types (Phase 7.5 requirement). Admin and customer
// views resolve display names through this map only.
export const NFC_TAG_TYPE_LABELS: Record<string, string> = {
  mini: 'NFC Mini',
  standard: 'NFC Standard',
  on_metal: 'Metallitunniste',
};

export interface NfcProduct {
  tagType: OrderableTagType; // the real backend value this SKU sends
  name: string;
  chip: string;
  memory: string;
  diameter: string;
  description: string;
}

export const NFC_PRODUCTS: NfcProduct[] = [
  {
    tagType: 'mini',
    name: NFC_TAG_TYPE_LABELS.mini,
    chip: 'NTAG213',
    memory: '144 tavua',
    diameter: 'Ø22 mm',
    description: 'Soveltuu pieniin tuotteisiin, etiketteihin ja pakkauksiin.',
  },
  {
    tagType: 'standard',
    name: NFC_TAG_TYPE_LABELS.standard,
    chip: 'NTAG213',
    memory: '144 tavua',
    diameter: 'Ø38 mm',
    description: 'Helpompi käsitellä ja kiinnittää suurempiin tuotteisiin.',
  },
];

export function nfcProductByTagType(tagType: string): NfcProduct | undefined {
  return NFC_PRODUCTS.find(p => p.tagType === tagType);
}

// Display name for a stored tag_type, via the single label map. Falls back to the
// raw value only if an unknown enum ever appears (defensive).
export function nfcProductName(tagType: string): string {
  return NFC_TAG_TYPE_LABELS[tagType] ?? tagType;
}

// fi-FI currency formatting, e.g. 30 -> "30,00 €", 3 -> "3,00 €".
export function formatEur(amount: number): string {
  return new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' }).format(amount);
}

export function orderTotal(quantity: number): number {
  return quantity * NFC_UNIT_PRICE_EUR;
}

// "10 × 3,00 € = 30,00 €" for the live quantity line.
export function orderTotalLine(quantity: number): string {
  return `${quantity} × ${formatEur(NFC_UNIT_PRICE_EUR)} = ${formatEur(orderTotal(quantity))}`;
}
