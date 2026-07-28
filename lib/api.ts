const API = process.env.NEXT_PUBLIC_API_URL ?? '';

export class ApiError extends Error {
  constructor(public status: number, public body: unknown) {
    super(`API error ${status}`);
  }
}

// Thrown when fetch() itself fails — CORS preflight blocked, network unreachable, DNS failure.
// Distinguished from ApiError (which means the server responded with 4xx/5xx).
export class NetworkError extends Error {
  constructor(public url: string, public method: string) {
    super(`NetworkError: ${method} ${url}`);
  }
}

async function req<T>(token: string | null, path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (!(init.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${API}${path}`;
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { ...headers, ...(init.headers as Record<string, string> || {}) } });
  } catch {
    // fetch() threw — this is always a network-level failure (CORS preflight 403,
    // DNS failure, connection refused, TLS error). The server never sent a response.
    throw new NetworkError(url, (init.method ?? 'GET').toUpperCase());
  }
  const data = await res.json();
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

export function apiErrMsg(e: unknown): string {
  if (e instanceof NetworkError) {
    return [
      'Verkkovirhe tai CORS-ongelma — selain ei tavoittanut API-palvelinta.',
      `URL: ${e.method} ${e.url}`,
      'Tarkista: CORS_ORIGIN (Worker secret) ja NEXT_PUBLIC_API_URL (Vercel env).',
    ].join('\n');
  }
  if (e instanceof ApiError) {
    const body = e.body as { error?: string; limit?: number };
    const map: Record<string, string> = {
      no_active_organization: 'Ei aktiivista organisaatiota. Valitse organisaatio navipalkin vaihtajasta.',
      tenant_not_found: 'Organisaatiota ei löydy järjestelmästä. Ota yhteyttä tukeen.',
      tenant_inactive: 'Tili ei ole aktiivinen. Ota yhteyttä tukeen tilisi aktivoimiseksi.',
      tenant_suspended: 'Tili jäädytetty. Ota yhteyttä tukeen.',
      tenant_archived: 'Tili on arkistoitu.',
      tenant_blocked: 'Tili on estetty. Ota yhteyttä tukeen.',
      product_limit_reached: `Tuoteraja täynnä (${body.limit ?? '?'} tuotetta). Päivitä plan asetuksista.`,
      product_name_required: 'Tuotteen nimi on pakollinen.',
      unauthorized: 'Kirjautuminen vaaditaan.',
      not_found: 'Tuotetta ei löydy.',
      already_claimed: 'Tuote on jo yhdistetty toiseen tenantiin.',
      invalid_compliance_status: 'Virheellinen vaatimustenmukaisuusstatus.',
      invalid_tag_type: 'Valitse kelvollinen NFC-tunnisteen tyyppi.',
      invalid_quantity: 'Anna kelvollinen kappalemäärä (vähintään 1).',
      recipient_name_required: 'Vastaanottajan nimi on pakollinen.',
      address_line_required: 'Toimitusosoite on pakollinen.',
      postal_code_required: 'Postinumero on pakollinen.',
      city_required: 'Kaupunki on pakollinen.',
      invalid_country_code: 'Anna kaksikirjaiminen maakoodi (esim. FI).',
      product_archived: 'Arkistoidulle tuotteelle ei voi tilata NFC-tunnisteita.',
      invalid_transition: 'Tilasiirtymä ei ole sallittu.',
    };
    return map[body.error ?? ''] ?? `Virhe ${e.status}: ${JSON.stringify(e.body)}`;
  }
  return String(e);
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface ProductSummary {
  id: string;
  public_slug: string;
  product_uid: string;
  product_name: string;
  brand_name: string | null;
  status: 'draft' | 'active' | 'archived';
  version: number;
  data_carrier_type: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  owner_token?: string;
}

export interface Product extends ProductSummary {
  owner_token: string;
  passport_uid: string;
  tenant_id: string | null;
  manufacturer_name: string | null;
  manufacturer_email: string | null;
  manufacturer_address: string | null;
  responsible_operator_name: string | null;
  responsible_operator_email: string | null;
  responsible_operator_address: string | null;
  sku: string | null;
  gtin: string | null;
  batch_number: string | null;
  serial_number: string | null;
  product_type: string | null;
  materials_json: string;
  substances_json: string;
  safety_notes_json: string;
  care_instructions_json: string;
  repair_instructions_json: string;
  recycling_instructions_json: string;
  compliance_documents_json: string;
  languages_json: string;
  visibility_json: string;
  translations_json: string;
  data_carrier_url: string;
  identifier_level: string;
  compliance_status: string;
  category_id: string | null;
  target_markets_json: string;
}

export interface ComplianceIssue {
  rule_code: string;
  regulation: string;
  severity: string;
  field: string | null;
  message_en: string;
  message_fi: string;
}

export interface ComplianceResult {
  product_uid: string;
  computed_at: string;
  product_version: number;
  cached: boolean;
  status: 'incomplete' | 'complete';
  score: number;
  verification_suggested: boolean;
  category: string | null;
  target_markets: string[];
  missing: ComplianceIssue[];
  warnings: ComplianceIssue[];
  info: ComplianceIssue[];
  passed: { rule_code: string; regulation: string }[];
  rules_applied: string[];
  regulations_applied: { code: string; name: string; version: string; status: string }[];
}

export interface Tenant {
  id: string;
  clerk_org_id: string;
  name: string;
  slug: string | null;
  plan: string;
  status: string;
  billing_status: string;
  product_limit: number;
  created_at: string;
  updated_at: string;
  stripe_customer_id: string | null;
}

export interface TenantSelf {
  name: string;
  plan: string;
  status: string;
  billing_status: string;
  product_limit: number;
  product_count: number;
}

export interface TenantBillingRow {
  id: string;
  name: string;
  plan: string;
  tenant_status: string;
  billing_status: 'not_due' | 'due_now' | 'overdue' | 'invoiced' | 'paid';
  billing_period: 'monthly' | 'annual' | 'one_time';
  price_eur: number;
  vat_rate: number;
  next_invoice_date: string | null;
  last_invoice_date: string | null;
  holvi_invoice_number: string | null;
  notes: string | null;
  updated_at: string | null;
}

export interface TenantUser {
  id: string;
  clerk_user_id: string;
  role: string;
  joined_at: string;
}

// ── NFC orders ───────────────────────────────────────────────────────────────

// Customer-facing order (admin_note is never returned by the API).
export interface NfcOrder {
  id: string;
  order_number: string;
  product_id: string;
  public_slug: string;
  programming_url: string;
  tag_type: string;
  quantity: number;
  status: string;
  recipient_name: string;
  company_name: string | null;
  address_line: string;
  postal_code: string;
  city: string;
  country_code: string;
  customer_note: string | null;
  tracking_code: string | null;
  tracking_url: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  programmed_at: string | null;
  shipped_at: string | null;
  cancelled_at: string | null;
}

// Admin-side order (adds fulfilment fields + joined tenant/product names).
export interface NfcOrderAdmin extends NfcOrder {
  tenant_id: string;
  tenant_name: string | null;
  product_name: string | null;
  product_status?: string;
  public_slug_snapshot: string;
  programming_url_snapshot: string;
  admin_note: string | null;
}

export interface NfcOrderInput {
  tag_type: 'standard' | 'on_metal';
  quantity: number;
  recipient_name: string;
  company_name?: string;
  address_line: string;
  postal_code: string;
  city: string;
  country_code: string;
  customer_note?: string;
}

// ── Tenant API ─────────────────────────────────────────────────────────────

function orgHeader(orgId?: string | null): Record<string, string> {
  return orgId ? { 'X-Organization-Id': orgId } : {};
}

export async function getTenantSelf(token: string, orgId?: string | null): Promise<TenantSelf> {
  return req(token, '/api/tenant/self', { headers: orgHeader(orgId) });
}

export async function listProducts(token: string, orgId?: string | null, status?: string): Promise<ProductSummary[]> {
  const q = status ? `?status=${status}` : '';
  const res = await req<{ products: ProductSummary[] }>(token, `/api/tenant/products${q}`, { headers: orgHeader(orgId) });
  return res.products;
}

export async function getProduct(token: string, slug: string, orgId?: string | null): Promise<Product> {
  return req<Product>(token, `/api/tenant/product/${slug}`, { headers: orgHeader(orgId) });
}

export async function createProduct(token: string, body: Record<string, unknown>, orgId?: string | null): Promise<{ slug: string; token: string; product_uid: string }> {
  return req(token, '/api/tenant/product', { method: 'POST', body: JSON.stringify(body), headers: orgHeader(orgId) });
}

export async function updateProduct(token: string, slug: string, body: Record<string, unknown>, orgId?: string | null): Promise<Product> {
  return req<Product>(token, `/api/tenant/product/${slug}`, { method: 'POST', body: JSON.stringify(body), headers: orgHeader(orgId) });
}

export async function deleteProduct(token: string, slug: string, orgId?: string | null): Promise<void> {
  await req(token, `/api/tenant/product/${slug}`, { method: 'DELETE', headers: orgHeader(orgId) });
}

export async function regenerateShareLink(token: string, slug: string, orgId?: string | null): Promise<{ owner_url: string; token: string }> {
  return req(token, `/api/tenant/product/${slug}/share-link`, { method: 'POST', headers: orgHeader(orgId) });
}

export async function claimProduct(token: string, ownerToken: string, orgId?: string | null): Promise<{ slug: string }> {
  return req(token, `/api/tenant/claim/${ownerToken}`, { method: 'POST', headers: orgHeader(orgId) });
}

// NFC orders — customer side. The server derives tenant/product/URL from the
// authenticated context + slug; the body carries only order details.
export async function createNfcOrder(token: string, slug: string, body: NfcOrderInput, orgId?: string | null): Promise<{ order: NfcOrder; product_unpublished: boolean }> {
  return req(token, `/api/tenant/product/${slug}/nfc-orders`, { method: 'POST', body: JSON.stringify(body), headers: orgHeader(orgId) });
}

export async function listNfcOrders(token: string, slug: string, orgId?: string | null): Promise<NfcOrder[]> {
  const res = await req<{ orders: NfcOrder[] }>(token, `/api/tenant/product/${slug}/nfc-orders`, { headers: orgHeader(orgId) });
  return res.orders;
}

export async function getCompliance(productUid: string): Promise<ComplianceResult> {
  const res = await fetch(`${API}/api/v1/passport/${productUid}/compliance`);
  const data = await res.json();
  if (!res.ok) throw new ApiError(res.status, data);
  return data as ComplianceResult;
}

// ── Platform admin API ─────────────────────────────────────────────────────

export async function listTenants(token: string, offset = 0, includeArchived = false): Promise<{ tenants: Tenant[]; offset: number }> {
  const params = new URLSearchParams({ limit: '50', offset: String(offset) });
  if (includeArchived) params.set('include_archived', 'true');
  return req(token, `/api/admin/tenants?${params}`);
}

export async function getTenant(token: string, id: string): Promise<{ tenant: Tenant; products: ProductSummary[]; users: TenantUser[] }> {
  return req(token, `/api/admin/tenant/${id}`);
}

export async function updateTenant(token: string, id: string, body: Record<string, unknown>): Promise<void> {
  await req(token, `/api/admin/tenant/${id}`, { method: 'POST', body: JSON.stringify(body) });
}

export async function listUnclaimed(token: string, email?: string): Promise<{ products: ProductSummary[] }> {
  const q = email ? `?customer_email=${encodeURIComponent(email)}` : '';
  return req(token, `/api/admin/products/unclaimed${q}`);
}

export async function adminClaimProduct(token: string, tenantId: string, slug: string): Promise<void> {
  await req(token, `/api/admin/tenant/${tenantId}/product/${slug}/claim`, { method: 'POST' });
}

export async function getAdminStats(token: string): Promise<{ tenant_count: number; product_count: number }> {
  return req(token, '/api/admin/stats');
}

export async function listBilling(token: string): Promise<{ rows: TenantBillingRow[] }> {
  return req(token, '/api/admin/billing');
}

export async function updateBilling(
  token: string,
  tenantId: string,
  body: Partial<Pick<TenantBillingRow, 'billing_status' | 'billing_period' | 'price_eur' | 'vat_rate' | 'next_invoice_date' | 'last_invoice_date' | 'holvi_invoice_number' | 'notes'>>
): Promise<TenantBillingRow> {
  return req(token, `/api/admin/tenant/${tenantId}/billing`, { method: 'POST', body: JSON.stringify(body) });
}

export async function adminCreateProductForTenant(
  token: string,
  tenantId: string,
  body: { product_name: string; product_type?: string }
): Promise<{ id: string; product_uid: string; public_slug: string; owner_token: string; passport_uid: string }> {
  return req(token, `/api/admin/tenant/${tenantId}/product`, { method: 'POST', body: JSON.stringify(body) });
}

// NFC orders — platform admin side.
export async function listAdminNfcOrders(token: string, status?: string): Promise<{ orders: NfcOrderAdmin[] }> {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  return req(token, `/api/admin/nfc-orders${q}`);
}

export async function getAdminNfcOrder(token: string, id: string): Promise<{ order: NfcOrderAdmin }> {
  return req(token, `/api/admin/nfc-orders/${id}`);
}

export async function updateNfcOrderStatus(
  token: string,
  id: string,
  body: { status: string; admin_note?: string; tracking_code?: string; tracking_url?: string }
): Promise<{ order: NfcOrderAdmin }> {
  return req(token, `/api/admin/nfc-orders/${id}/status`, { method: 'POST', body: JSON.stringify(body) });
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function parseJson<T>(json: string | null | undefined, fallback: T): T {
  try { return JSON.parse(json || '') as T; } catch { return fallback; }
}

export function statusLabel(s: string) {
  return { draft: 'Luonnos', active: 'Julkaistu', archived: 'Arkistoitu' }[s] ?? s;
}

export function statusColor(s: string) {
  return { draft: 'text-gray-500 bg-gray-100 border-gray-200', active: 'text-green-700 bg-green-50 border-green-200', archived: 'text-red-600 bg-red-50 border-red-200' }[s] ?? '';
}

export function fmtDate(str: string | null | undefined) {
  if (!str) return '—';
  try { return new Date(str.includes('T') ? str : str.replace(' ', 'T') + 'Z').toLocaleDateString('fi-FI', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return str; }
}
