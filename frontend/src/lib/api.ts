/**
 * Centralized API client for Inkto.
 * Always attaches Authorization header from localStorage and sets credentials: 'include'.
 * Use this for ALL calls to inkto.jointaccount.org/api/*
 */

const API_BASE = 'https://inkto.jointaccount.org/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('inkto_session');
}

function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    ...(extra || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-Inkto-Auth'] = token;
  }
  return headers;
}

/**
 * GET an API endpoint. Returns parsed JSON or throws.
 */
export async function apiGet<T = any>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  // Cache buster
  url.searchParams.set('_t', Date.now().toString());

  const res = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
    headers: buildHeaders(),
    cache: 'no-store',
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('json') ? await res.json() : { raw: await res.text() };

  if (!res.ok) {
    throw new Error(data.error || data.message || `API error ${res.status}`);
  }
  return data as T;
}

/**
 * POST JSON to an API endpoint. Returns parsed JSON or throws.
 */
export async function apiPost<T = any>(path: string, body: object): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);

  const res = await fetch(url.toString(), {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('json') ? await res.json() : { raw: await res.text() };

  if (!res.ok) {
    throw new Error(data.error || data.message || `API error ${res.status}`);
  }
  return data as T;
}

/**
 * POST FormData (multipart) to an API endpoint. Returns parsed JSON or throws.
 */
export async function apiPostForm<T = any>(path: string, formData: FormData): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);

  // Note: do NOT set Content-Type here — browser sets it automatically with boundary for FormData
  const res = await fetch(url.toString(), {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(), // no Content-Type here
    body: formData,
    cache: 'no-store',
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('json') ? await res.json() : { raw: await res.text() };

  if (!res.ok) {
    throw new Error(data.error || data.message || `API error ${res.status}`);
  }
  return data as T;
}
