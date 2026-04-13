/**
 * AfriVogue API Client
 * Replaces the Supabase client. All requests go to the Node.js/Express backend.
 *
 * Usage:
 *   import { api } from '@/integrations/api/client';
 *   const trends = await api.from('trends').select('*').eq('published', true).execute();
 *   const { token } = await api.auth.signIn(email, password);
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ─── Token storage ────────────────────────────────────────────────────────────
const TOKEN_KEY = 'afrivogue_token';
const USER_KEY = 'afrivogue_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string, user: any) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): any | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

// ─── Raw fetch helper ─────────────────────────────────────────────────────────
async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  return response;
}

async function apiJson<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await apiFetch(path, options);
    const json = await res.json();
    if (!res.ok) {
      return { data: null, error: json.error || `HTTP ${res.status}` };
    }
    return { data: json as T, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Network error' };
  }
}

// ─── Query Builder (mirrors Supabase chaining API) ────────────────────────────
class QueryBuilder {
  private _table: string;
  private _filters: Record<string, any> = {};
  private _select: string = '*';
  private _order: { column: string; ascending: boolean } | null = null;
  private _limit: number | null = null;
  private _offset: number | null = null;
  private _single: boolean = false;
  private _maybeSingle: boolean = false;
  private _head: boolean = false;
  private _count: 'exact' | null = null;
  private _method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET';
  private _body: any = null;

  constructor(table: string) {
    this._table = table;
  }

  select(columns: string = '*', opts?: { count?: 'exact'; head?: boolean }) {
    this._select = columns;
    if (opts?.count) this._count = opts.count;
    if (opts?.head) this._head = opts.head;
    return this;
  }

  eq(column: string, value: any) {
    this._filters[column] = value;
    return this;
  }

  neq(column: string, value: any) {
    this._filters[`${column}__neq`] = value;
    return this;
  }

  lt(column: string, value: any) {
    this._filters[`${column}__lt`] = value;
    return this;
  }

  gt(column: string, value: any) {
    this._filters[`${column}__gt`] = value;
    return this;
  }

  is(column: string, value: any) {
    this._filters[column] = value;
    return this;
  }

  in(column: string, values: any[]) {
    this._filters[`${column}__in`] = values.join(',');
    return this;
  }

  ilike(column: string, pattern: string) {
    this._filters[`${column}__ilike`] = pattern;
    return this;
  }

  gte(column: string, value: any) {
    this._filters[`${column}__gte`] = value;
    return this;
  }

  lte(column: string, value: any) {
    this._filters[`${column}__lte`] = value;
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this._order = { column, ascending: opts?.ascending ?? true };
    return this;
  }

  limit(n: number) {
    this._limit = n;
    return this;
  }

  offset(n: number) {
    this._offset = n;
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  maybeSingle() {
    this._maybeSingle = true;
    return this;
  }

  insert(values: any) {
    this._method = 'POST';
    this._body = values;
    return this;
  }

  update(values: any) {
    this._method = 'PUT';
    this._body = values;
    return this;
  }

  delete() {
    this._method = 'DELETE';
    return this;
  }

  upsert(values: any, _opts?: any) {
    this._method = 'POST';
    this._body = { ...values, _upsert: true };
    return this;
  }

  private buildUrl(): string {
    const route = `/${this._table}`;
    const params = new URLSearchParams();

    // Apply filters as query params for GET requests
    if (this._method === 'GET') {
      for (const [key, val] of Object.entries(this._filters)) {
        if (val !== null && val !== undefined) params.set(key, String(val));
      }
      if (this._select !== '*') params.set('select', this._select);
      if (this._order) {
        params.set('orderBy', this._order.column);
        params.set('ascending', String(this._order.ascending));
      }
      if (this._limit !== null) params.set('limit', String(this._limit));
      if (this._offset !== null) params.set('offset', String(this._offset));
    }

    // For ID-based updates/deletes, extract 'id' filter
    const idFilter = this._filters['id'];

    const queryStr = params.toString();
    let url = route;
    if (idFilter && (this._method === 'PUT' || this._method === 'DELETE')) {
      url = `${route}/${idFilter}`;
    } else if (queryStr) {
      url = `${route}?${queryStr}`;
    }

    return url;
  }

  async execute(): Promise<{ data: any; error: any; count?: number }> {
    const url = this.buildUrl();

    if (this._method === 'GET') {
      const { data, error } = await apiJson(url);
      if (this._single || this._maybeSingle) {
        const item = Array.isArray(data) ? data[0] ?? null : data;
        return { data: item, error };
      }
      if (this._head && this._count === 'exact') {
        return { data: null, error, count: Array.isArray(data) ? data.length : 0 };
      }
      return { data, error };
    }

    if (this._method === 'POST') {
      const { data, error } = await apiJson(url, {
        method: 'POST',
        body: JSON.stringify(this._body),
      });
      return { data, error };
    }

    if (this._method === 'PUT') {
      const idFilter = this._filters['id'];
      const route = idFilter ? `/${this._table}/${idFilter}` : `/${this._table}`;
      const { data, error } = await apiJson(route, {
        method: 'PUT',
        body: JSON.stringify(this._body),
      });
      return { data, error };
    }

    if (this._method === 'DELETE') {
      const idFilter = this._filters['id'];
      const route = idFilter ? `/${this._table}/${idFilter}` : `/${this._table}`;
      const { data, error } = await apiJson(route, { method: 'DELETE' });
      return { data, error };
    }

    return { data: null, error: 'Unknown method' };
  }

  // Allow `await builder` (thenable)
  then(resolve: (value: any) => any, reject: (reason: any) => any) {
    return this.execute().then(resolve, reject);
  }
}

// ─── Auth API ──────────────────────────────────────────────────────────────────
class AuthAPI {
  private _listeners: Array<(event: string, session: any) => void> = [];

  async signInWithPassword(credentials: { email: string; password: string }) {
    const { data, error } = await apiJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (!error && data?.token) {
      setToken(data.token, data.user);
      this._notifyListeners('SIGNED_IN', { user: data.user, token: data.token });
    }
    return { data: data ?? null, error: error ? { message: error } : null };
  }

  async signUp(credentials: {
    email: string;
    password: string;
    options?: { data?: { display_name?: string } };
  }) {
    const { data, error } = await apiJson('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        display_name: credentials.options?.data?.display_name,
      }),
    });
    if (!error && data?.token) {
      setToken(data.token, data.user);
      this._notifyListeners('SIGNED_IN', { user: data.user, token: data.token });
    }
    return { data: data ?? null, error: error ? { message: error } : null };
  }

  async signOut() {
    clearToken();
    this._notifyListeners('SIGNED_OUT', null);
    return { error: null };
  }

  async getSession() {
    const token = getToken();
    if (!token) return { data: { session: null }, error: null };
    const user = getStoredUser();
    return { data: { session: { user, access_token: token } }, error: null };
  }

  async getUser() {
    const token = getToken();
    if (!token) return { data: { user: null }, error: null };
    const { data, error } = await apiJson('/auth/session');
    return { data: { user: data?.user ?? null }, error };
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    this._listeners.push(callback);
    // Immediately fire with current state
    const token = getToken();
    const user = getStoredUser();
    if (token && user) {
      setTimeout(() => callback('SIGNED_IN', { user, access_token: token }), 0);
    } else {
      setTimeout(() => callback('SIGNED_OUT', null), 0);
    }
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this._listeners = this._listeners.filter((l) => l !== callback);
          },
        },
      },
    };
  }

  private _notifyListeners(event: string, session: any) {
    for (const listener of this._listeners) {
      listener(event, session);
    }
  }
}

// ─── Functions API (replaces Supabase Edge Functions) ─────────────────────────
class FunctionsAPI {
  async invoke(functionName: string, options?: { body?: any }) {
    const functionRoutes: Record<string, string> = {
      'check-subscription': '/profiles/subscription',
      'create-checkout': '/shop/stripe/checkout',
      'create-shop-checkout': '/shop/stripe/shop-checkout',
      'handle-email-unsubscribe': '/email/unsubscribe',
      'send-transactional-email': '/email/send',
      'ingest-trends': '/trends/ingest',
      'ingest-forecasts': '/forecasts/ingest',
      'ingest-moodboard': '/moodboard/ingest',
      'ingest-trivia': '/trivia/ingest',
    };

    const route = functionRoutes[functionName];
    if (!route) {
      console.warn(`Unknown function: ${functionName}`);
      return { data: null, error: { message: `Unknown function: ${functionName}` } };
    }

    const { data, error } = await apiJson(route, {
      method: 'POST',
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
    return { data, error: error ? { message: error } : null };
  }
}

// ─── RPC API (replaces Supabase RPC calls) ────────────────────────────────────
class RPCAPI {
  async call(functionName: string, params?: any) {
    if (functionName === 'has_role') {
      // Check role from stored JWT user data
      const user = getStoredUser();
      if (!user || !params) return false;
      const { _role } = params;
      return Array.isArray(user.roles) && user.roles.includes(_role);
    }

    const { data, error } = await apiJson(`/rpc/${functionName}`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    if (error) return null;
    return data;
  }
}

// ─── Main API client ──────────────────────────────────────────────────────────
class ApiClient {
  public auth = new AuthAPI();
  public functions = new FunctionsAPI();
  private _rpc = new RPCAPI();

  from(table: string): QueryBuilder {
    return new QueryBuilder(table);
  }

  rpc(functionName: string, params?: any) {
    return this._rpc.call(functionName, params);
  }

  // Direct fetch for custom API calls
  async fetch(path: string, options?: RequestInit) {
    return apiJson(path, options);
  }
}

export const api = new ApiClient();

// Named export for drop-in replacement where code uses `supabase`
export const supabase = api;
