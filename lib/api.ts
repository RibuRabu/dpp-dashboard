const API = process.env.NEXT_PUBLIC_API_URL ?? '';

export class ApiError extends Error {
  constructor(public status: number, public body: unknown) {
    super(`API error ${status}`);
  }
}

async function req<T>(token: string | null, path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...init, headers: { ...headers, ...(init.headers as Record<string, string> || {}) } });
  const data = await res.json();
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
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

export interface TenantUser {
  id: string;
  clerk_user_id: string;
  role: string;
  joined_at: string;
}

// ── Tenant API ─────────────────────────────────────────────────────────────

export async function listProducts(token: string, status?: string): Promise<ProductSummary[]> {
  const q = status ? `?status=${status}` : '';
  const res = await req<{ products: ProductSummary[] }>(token, `/api/tenant/products${q}`);
  return res.products;
}

export async function getProduct(token: string, slug: string): Promise<Product> {
  return req<Product>(token, `/api/tenant/product/${slug}`);
}

export async function createProduct(token: string, body: Record<string, unknown>): Promise<{ slug: string; token: string; product_uid: string }> {
  return req(token, '/api/tenant/product', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateProduct(token: string, slug: string, body: Record<string, unknown>): Promise<Product> {
  return req<Product>(token, `/api/tenant/product/${slug}`, { method: 'POST', body: JSON.stringify(body) });
}

export async function deleteProduct(token: string, slug: string): Promise<void> {
  await req(token, `/api/tenant/product/${slug}`, { method: 'DELETE' });
}

export async function regenerateShareLink(token: string, slug: string): Promise<{ owner_url: string; token: string }> {
  return req(token, `/api/tenant/product/${slug}/share-link`, { method: 'POST' });
}

export async function claimProduct(token: string, ownerToken: string): Promise<{ slug: string }> {
  return req(token, `/api/tenant/claim/${ownerToken}`, { method: 'POST' });
}

// ── Platform admin API ─────────────────────────────────────────────────────

export async function listTenants(token: string, offset = 0): Promise<{ tenants: Tenant[]; offset: number }> {
  return req(token, `/api/admin/tenants?limit=50&offset=${offset}`);
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
