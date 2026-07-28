import { describe, it, expect } from 'vitest';
import {
  NFC_PRODUCTS, NFC_UNIT_PRICE_EUR, NFC_MIN_ORDER_QTY,
  formatEur, orderTotal, orderTotalLine, nfcProductByTagType, nfcProductName,
} from './nfc-catalog';

describe('NFC catalogue', () => {
  it('offers exactly two SKUs — NFC Mini and NFC Standard — and nothing else', () => {
    expect(NFC_PRODUCTS).toHaveLength(2);
    expect(NFC_PRODUCTS.map(p => p.name).sort()).toEqual(['NFC Mini', 'NFC Standard']);
  });

  it('maps the SKUs onto the existing backend tag_type slots', () => {
    expect(nfcProductByTagType('on_metal')?.name).toBe('NFC Mini');
    expect(nfcProductByTagType('standard')?.name).toBe('NFC Standard');
  });

  it('both SKUs are NTAG213 / 144 tavua with the specified diameters', () => {
    const mini = nfcProductByTagType('on_metal')!;
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
