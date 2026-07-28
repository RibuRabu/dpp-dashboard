import { describe, it, expect } from 'vitest';
import {
  NFC_PRODUCTS, NFC_UNIT_PRICE_EUR, NFC_MIN_ORDER_QTY, NFC_TAG_TYPE_LABELS,
  formatEur, orderTotal, orderTotalLine, nfcProductByTagType, nfcProductName,
} from './nfc-catalog';

describe('NFC catalogue', () => {
  it('offers exactly two orderable SKUs — NFC Mini and NFC Standard', () => {
    expect(NFC_PRODUCTS).toHaveLength(2);
    expect(NFC_PRODUCTS.map(p => p.name).sort()).toEqual(['NFC Mini', 'NFC Standard']);
  });

  it('uses the REAL backend tag_type values (no fake on_metal mapping)', () => {
    expect(NFC_PRODUCTS.map(p => p.tagType).sort()).toEqual(['mini', 'standard']);
    expect(nfcProductByTagType('mini')?.name).toBe('NFC Mini');
    expect(nfcProductByTagType('standard')?.name).toBe('NFC Standard');
    // on_metal is NOT an orderable SKU (only mini/standard are offered today)
    expect(nfcProductByTagType('on_metal')).toBeUndefined();
  });

  it('has a single label map covering all three tag types', () => {
    expect(NFC_TAG_TYPE_LABELS.mini).toBe('NFC Mini');
    expect(NFC_TAG_TYPE_LABELS.standard).toBe('NFC Standard');
    expect(NFC_TAG_TYPE_LABELS.on_metal).toBe('Metallitunniste');
    expect(nfcProductName('on_metal')).toBe('Metallitunniste');
  });

  it('both SKUs are NTAG213 / 144 tavua with the specified diameters', () => {
    const mini = nfcProductByTagType('mini')!;
    const std = nfcProductByTagType('standard')!;
    expect(mini.chip).toBe('NTAG213');
    expect(std.chip).toBe('NTAG213');
    expect(mini.memory).toBe('144 tavua');
    expect(std.memory).toBe('144 tavua');
    expect(mini.diameter).toBe('Ø22 mm');
    expect(std.diameter).toBe('Ø38 mm');
  });

  it('prices both SKUs at 3,00 € and requires a 10-piece minimum', () => {
    expect(NFC_UNIT_PRICE_EUR).toBe(3.0);
    expect(NFC_MIN_ORDER_QTY).toBe(10);
  });

  it('nfcProductName falls back to the raw value for an unknown enum', () => {
    expect(nfcProductName('mystery')).toBe('mystery');
  });
});

describe('fi-FI currency formatting', () => {
  it('formats the unit price and totals with a comma and euro sign', () => {
    // Intl uses a non-breaking space before €; normalise whitespace before asserting.
    expect(formatEur(3).replace(/\s/g, '')).toBe('3,00€');
    expect(formatEur(30).replace(/\s/g, '')).toBe('30,00€');
  });

  it('orderTotal multiplies quantity by the unit price', () => {
    expect(orderTotal(10)).toBe(30);
    expect(orderTotal(250)).toBe(750);
  });

  it('orderTotalLine reads "10 × 3,00 € = 30,00 €"', () => {
    const line = orderTotalLine(10);
    expect(line).toContain('10 ×');
    expect(line).toContain('=');
    expect(line.replace(/\s/g, '')).toContain('3,00€');
    expect(line.replace(/\s/g, '')).toContain('30,00€');
  });
});
