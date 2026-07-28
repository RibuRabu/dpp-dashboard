// NFC product catalogue — the single source of truth for what a customer can
// order, the price, and the minimum order. Presentation/commerce only; there is
// no payment integration in this phase.
//
// Backend mapping note: the Worker's nfc_orders.tag_type accepts exactly two
// values ('standard', 'on_metal'). Phase 7 defines exactly two SKUs, so we map
// them onto those existing slots WITHOUT changing the Worker API or database:
//   NFC Standard  -> tag_type 'standard'   (Ø38 mm)
//   NFC Mini      -> tag_type 'on_metal'   (Ø22 mm)
// The raw enum is never shown to a user; every label goes through this catalogue.
// A future phase could rename the backend enum to 'mini'/'standard' for clarity.

export const NFC_UNIT_PRICE_EUR = 3.0;   // € per tag — same for both SKUs
export const NFC_MIN_ORDER_QTY = 10;     // minimum tags per order
export const NFC_MAX_ORDER_QTY = 10000;  // upper bound (mirrors the Worker)

export type NfcTagTypeValue = 'standard' | 'on_metal';

export interface NfcProduct {
  tagType: NfcTagTypeValue; // backend enum slot this SKU maps to
  name: string;
  chip: string;
  memory: string;
  diameter: string;
  description: string;
}

export const NFC_PRODUCTS: NfcProduct[] = [
  {
    tagType: 'on_metal',
    name: 'NFC Mini',
    chip: 'NTAG213',
    memory: '144 tavua',
    diameter: 'Ø22 mm',
    description: 'Soveltuu pieniin tuotteisiin, etiketteihin ja pakkauksiin.',
  },
  {
    tagType: 'standard',
    name: 'NFC Standard',
    chip: 'NTAG213',
    memory: '144 tavua',
    diameter: 'Ø38 mm',
    description: 'Helpompi käsitellä ja kiinnittää suurempiin tuotteisiin.',
  },
];

export function nfcProductByTagType(tagType: string): NfcProduct | undefined {
  return NFC_PRODUCTS.find(p => p.tagType === tagType);
}

// Display name for a stored tag_type. Falls back to the raw value only if an
// unknown enum ever appears (defensive; should not happen).
export function nfcProductName(tagType: string): string {
  return nfcProductByTagType(tagType)?.name ?? tagType;
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
