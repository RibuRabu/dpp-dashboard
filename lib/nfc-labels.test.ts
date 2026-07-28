import { describe, it, expect } from 'vitest';
import {
  nfcStatusLabel, nfcTagTypeLabel, nfcNextStatuses, NFC_STATUS_LABELS, NFC_ADMIN_NEXT_STATUSES,
} from './nfc-labels';

describe('nfcStatusLabel', () => {
  it('maps every internal status to a Finnish label, never the raw enum', () => {
    expect(nfcStatusLabel('new')).toBe('Uusi');
    expect(nfcStatusLabel('confirmed')).toBe('Vahvistettu');
    expect(nfcStatusLabel('processing')).toBe('Käsittelyssä');
    expect(nfcStatusLabel('programmed')).toBe('Ohjelmoitu');
    expect(nfcStatusLabel('shipped')).toBe('Lähetetty');
    expect(nfcStatusLabel('cancelled')).toBe('Peruttu');
  });
  it('falls back to the input for an unknown status', () => {
    expect(nfcStatusLabel('weird')).toBe('weird');
  });
});

describe('nfcTagTypeLabel', () => {
  it('maps the two backend enum slots to the Phase 7 SKU names', () => {
    expect(nfcTagTypeLabel('standard')).toBe('NFC Standard');
    expect(nfcTagTypeLabel('on_metal')).toBe('NFC Mini');
  });
});

describe('nfcNextStatuses (mirrors the Worker transition map)', () => {
  it('offers forward moves and cancel from new', () => {
    expect(nfcNextStatuses('new')).toContain('confirmed');
    expect(nfcNextStatuses('new')).toContain('cancelled');
  });
  it('never offers a transition out of a terminal state', () => {
    expect(nfcNextStatuses('shipped')).toEqual([]);
    expect(nfcNextStatuses('cancelled')).toEqual([]);
  });
  it('never offers cancelled->shipped or any backward move', () => {
    expect(nfcNextStatuses('cancelled')).not.toContain('shipped');
    expect(nfcNextStatuses('programmed')).not.toContain('processing');
  });
  it('has an entry for every known status', () => {
    for (const s of Object.keys(NFC_STATUS_LABELS)) {
      expect(NFC_ADMIN_NEXT_STATUSES[s]).toBeDefined();
    }
  });
});
