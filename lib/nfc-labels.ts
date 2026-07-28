// Human-readable Finnish labels for NFC order enums. The raw status/tag_type
// values (new/confirmed/…, standard/on_metal) are internal and must never be
// shown to a customer or admin — always route through these helpers.

export type NfcStatus = 'new' | 'confirmed' | 'processing' | 'programmed' | 'shipped' | 'cancelled';
export type NfcTagType = 'standard' | 'on_metal';

export const NFC_STATUS_LABELS: Record<string, string> = {
  new: 'Uusi',
  confirmed: 'Vahvistettu',
  processing: 'Käsittelyssä',
  programmed: 'Ohjelmoitu',
  shipped: 'Lähetetty',
  cancelled: 'Peruttu',
};

export function nfcStatusLabel(status: string): string {
  return NFC_STATUS_LABELS[status] ?? status;
}

export const NFC_TAG_TYPE_LABELS: Record<string, string> = {
  standard: 'Tavallinen NFC-tunniste',
  on_metal: 'Metallipinnalle tarkoitettu NFC-tunniste',
};

export function nfcTagTypeLabel(tagType: string): string {
  return NFC_TAG_TYPE_LABELS[tagType] ?? tagType;
}

// Badge colours mirroring the tenant/product status pills used elsewhere.
export function nfcStatusColor(status: string): { color: string; borderColor: string } {
  switch (status) {
    case 'shipped':
    case 'programmed':
      return { color: 'var(--c-ok)', borderColor: 'var(--c-ok)' };
    case 'cancelled':
      return { color: 'var(--c-warn)', borderColor: 'rgba(196,40,42,.3)' };
    case 'confirmed':
    case 'processing':
      return { color: 'var(--c-accent)', borderColor: 'var(--c-accent)' };
    default: // new
      return { color: 'var(--c-text-3)', borderColor: 'var(--c-border)' };
  }
}

// Admin-side allowed forward transitions — mirrors the Worker's authoritative
// NFC_STATUS_TRANSITIONS. The server re-validates; this only shapes the UI so
// admins aren't offered actions the API would reject.
export const NFC_ADMIN_NEXT_STATUSES: Record<string, NfcStatus[]> = {
  new: ['confirmed', 'processing', 'programmed', 'shipped', 'cancelled'],
  confirmed: ['processing', 'programmed', 'shipped', 'cancelled'],
  processing: ['programmed', 'shipped', 'cancelled'],
  programmed: ['shipped', 'cancelled'],
  shipped: [],
  cancelled: [],
};

export function nfcNextStatuses(status: string): NfcStatus[] {
  return NFC_ADMIN_NEXT_STATUSES[status] ?? [];
}
