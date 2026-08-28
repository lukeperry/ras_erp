/**
 * Thin client for talking to the Frappe/ERPNext backend.
 *
 * Auth model: we never store credentials or API keys in this app. Login
 * calls Frappe's built-in `/api/method/login`, which sets an HttpOnly
 * session cookie (`sid`) on the browser. Every request below sends
 * `credentials: 'include'` so that cookie rides along automatically — the
 * browser handles it, nothing touches JS-land or localStorage.
 *
 * Frappe also requires a CSRF token header on state-changing requests. We
 * fetch it via a dedicated whitelisted method right after login and attach
 * it as `X-Frappe-CSRF-Token` on every subsequent request.
 */

let csrfToken: string | null = null;

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body) headers.set('Content-Type', 'application/json');
  if (csrfToken) headers.set('X-Frappe-CSRF-Token', csrfToken);

  const res = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 || res.status === 403) {
    throw new ApiError('Not authenticated', res.status);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || `Request failed: ${res.status}`, res.status);
  }

  const data = await res.json();
  // Frappe wraps whitelisted method responses in { message: ... }
  return (data.message ?? data) as T;
}

export interface CurrentUser {
  name: string;
  full_name: string;
  email: string;
  roles: string[];
}

export async function login(usr: string, pwd: string): Promise<void> {
  const res = await fetch('/api/method/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ usr, pwd }),
  });

  if (!res.ok) {
    throw new ApiError('Invalid username or password', res.status);
  }

  // The login response shape varies across Frappe versions, so fetch the
  // CSRF token explicitly via a dedicated whitelisted method instead of
  // relying on it being embedded in the login payload.
  await refreshCsrfToken();
}

export async function refreshCsrfToken(): Promise<void> {
  const boot = await request<{ csrf_token?: string }>(
    '/api/method/frappe.sessions.get_csrf_token',
  ).catch(() => null);
  if (boot?.csrf_token) csrfToken = boot.csrf_token;
}

export async function logout(): Promise<void> {
  await request('/api/method/logout', { method: 'POST' });
  csrfToken = null;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return request<CurrentUser>('/api/method/ras_erp.api.get_current_user');
}

export interface PipelineSummary {
  leads: number;
  quotations: number;
  sales_orders: number;
  delivery_notes: number;
  sales_invoices: number;
}

export async function getPipelineSummary(): Promise<PipelineSummary> {
  return request<PipelineSummary>('/api/method/ras_erp.api.get_pipeline_summary');
}

export type PipelineStage =
  | 'leads'
  | 'quotations'
  | 'sales_orders'
  | 'delivery_notes'
  | 'sales_invoices';

export interface PipelineRecord {
  name: string;
  modified: string;
  status?: string;
  [key: string]: unknown;
}

export async function getPipelineList(
  stage: PipelineStage,
  limit = 20,
  start = 0,
): Promise<PipelineRecord[]> {
  const params = new URLSearchParams({
    stage,
    limit: String(limit),
    start: String(start),
  });
  return request<PipelineRecord[]>(
    `/api/method/ras_erp.api.get_pipeline_list?${params.toString()}`,
  );
}

export interface QuoteFormOptions {
  leads: Array<{ name: string; lead_name?: string; company_name?: string; status?: string }>;
  customers: Array<{ name: string; customer_name?: string }>;
}

export async function getQuoteFormOptions(): Promise<QuoteFormOptions> {
  return request<QuoteFormOptions>('/api/method/ras_erp.api.get_quote_form_options');
}

export interface CreateQuotationPayload {
  lead_name?: string;
  customer?: string;
  project_reference?: string;
  requested_delivery_date?: string;
  item_code?: string;
  item_description?: string;
  qty?: number;
  rate?: number;
  uom?: string;
}

export async function createQuotation(payload: CreateQuotationPayload): Promise<{ name: string }> {
  const params = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return request<{ name: string }>(`/api/method/ras_erp.api.create_quotation?${params.toString()}`);
}

export { ApiError };
