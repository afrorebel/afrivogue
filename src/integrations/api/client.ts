// The site's single connection to the AfriVogue server (Node + MySQL on Hostinger).
//   import { api } from "@/integrations/api/client";
//   const { data, error } = await api.from("trends").select("*").eq("published", true);
import type { DbRequest, DbResult } from "./protocol";
import { QueryBuilder, type AnyRow } from "./queryBuilder";
import type { Database } from "./types";

type TableName = keyof Database["public"]["Tables"];
/** Rows are typed from the schema; embedded relations and extra columns stay loose. */
type RowOf<K extends TableName> = Database["public"]["Tables"][K]["Row"] & AnyRow;

function from<K extends TableName>(table: K): QueryBuilder<RowOf<K>>;
function from(table: string): QueryBuilder<AnyRow>;
function from(table: string) {
  return new QueryBuilder(dbTransport, table);
}

export interface User {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
  email_confirmed_at: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
}

export interface Session {
  user: User;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
    public code?: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<{ status: number; body: T }> {
  const res = await fetch(path, {
    credentials: "same-origin",
    ...init,
    headers: init.body instanceof FormData ? init.headers : { "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const body = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, body };
}

const post = <T>(path: string, data?: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(data ?? {}) });

const failure = (status: number, body: unknown, fallback: string) =>
  new ApiError((body as { error?: string })?.error || fallback, status);

/* ───────────── data ───────────── */

const dbTransport = async (req: DbRequest): Promise<DbResult> => {
  const { body } = await post<DbResult>("/api/db", req);
  return body;
};

/* ───────────── auth ───────────── */

type AuthEvent = "SIGNED_IN" | "SIGNED_OUT" | "INITIAL_SESSION" | "USER_UPDATED";
type AuthListener = (event: AuthEvent, session: Session | null) => void;

const listeners = new Set<AuthListener>();
let current: Session | null | undefined; // undefined until the first check
let pending: Promise<Session | null> | null = null;

function setSession(session: Session | null, event: AuthEvent) {
  current = session;
  listeners.forEach((fn) => fn(event, session));
}

async function loadSession(): Promise<Session | null> {
  if (current !== undefined) return current;
  pending ||= request<{ user: User | null }>("/api/auth/session")
    .then(({ body }) => {
      current = body.user ? { user: body.user } : null;
      return current;
    })
    .catch(() => null)
    .finally(() => {
      pending = null;
    });
  return pending;
}

async function authCall(path: string, data: unknown, event: AuthEvent) {
  try {
    const { status, body } = await post<{ user?: User; error?: string }>(path, data);
    if (status >= 400 || !body.user) return { data: { user: null, session: null }, error: failure(status, body, "Something went wrong. Please try again.") };
    const session = { user: body.user };
    setSession(session, event);
    return { data: { user: body.user, session }, error: null };
  } catch {
    return { data: { user: null, session: null }, error: new ApiError("We couldn't reach AfriVogue. Check your connection and try again.") };
  }
}

const auth = {
  async getSession() {
    return { data: { session: await loadSession() }, error: null };
  },
  async getUser() {
    const session = await loadSession();
    return { data: { user: session?.user ?? null }, error: null };
  },
  onAuthStateChange(fn: AuthListener) {
    listeners.add(fn);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            listeners.delete(fn);
          },
        },
      },
    };
  },
  signUp({ email, password, options }: { email: string; password: string; options?: { data?: Record<string, unknown> } }) {
    return authCall("/api/auth/signup", { email, password, data: options?.data }, "SIGNED_IN");
  },
  signInWithPassword({ email, password }: { email: string; password: string }) {
    return authCall("/api/auth/login", { email, password }, "SIGNED_IN");
  },
  async signOut() {
    await post("/api/auth/logout").catch(() => undefined);
    setSession(null, "SIGNED_OUT");
    return { error: null };
  },
  /** Emails a reset link (the same answer whether or not the account exists). */
  async resetPasswordForEmail(email: string) {
    const { status, body } = await post("/api/auth/recover", { email });
    return { data: {}, error: status >= 400 ? failure(status, body, "Couldn't send the email. Please try again.") : null };
  },
  /** Finishes a reset from the emailed link and signs the user in. */
  resetPassword(token: string, password: string) {
    return authCall("/api/auth/reset", { token, password }, "SIGNED_IN");
  },
  async updateUser({ password }: { password: string }) {
    const { status, body } = await post("/api/auth/password", { password });
    return { data: {}, error: status >= 400 ? failure(status, body, "Couldn't update your password.") : null };
  },
};

/* ───────────── storage ───────────── */

const uploadedUrls = new Map<string, string>();

const storage = {
  from(bucket: string) {
    return {
      async upload(path: string, file: File | Blob) {
        const form = new FormData();
        form.append("path", path);
        form.append("file", file);
        try {
          const { status, body } = await request<{ path?: string; publicUrl?: string; error?: string }>(`/api/storage/${bucket}`, {
            method: "POST",
            body: form,
          });
          if (status >= 400 || !body.path) return { data: null, error: failure(status, body, "Upload failed.") };
          uploadedUrls.set(`${bucket}/${path}`, body.publicUrl!);
          return { data: { path: body.path }, error: null };
        } catch {
          return { data: null, error: new ApiError("Upload failed. Check your connection.") };
        }
      },
      getPublicUrl(path: string) {
        const known = uploadedUrls.get(`${bucket}/${path}`);
        return { data: { publicUrl: known || `${window.location.origin}/uploads/${bucket}/${path}` } };
      },
    };
  },
};

/* ───────────── server functions ───────────── */

interface JobState {
  status: "running" | "done" | "failed";
  result?: unknown;
  error?: string;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const functions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async invoke<T = any>(name: string, options: { body?: unknown } = {}): Promise<{ data: T | null; error: ApiError | null }> {
    try {
      const { status, body } = await post<T & { job?: string; error?: string }>(`/api/functions/${name}`, options.body);
      if (status >= 400) return { data: null, error: failure(status, body, "Something went wrong. Please try again.") };
      // Long content jobs run in the background; wait for them to finish.
      if (status === 202 && body.job) {
        const deadline = Date.now() + 30 * 60 * 1000;
        while (Date.now() < deadline) {
          await wait(4000);
          const poll = await request<JobState & { error?: string }>(`/api/jobs/${body.job}`);
          if (poll.status >= 400) return { data: null, error: failure(poll.status, poll.body, "Lost track of the job.") };
          if (poll.body.status === "done") return { data: poll.body.result as T, error: null };
          if (poll.body.status === "failed") return { data: null, error: new ApiError(poll.body.error || "The job failed.") };
        }
        return { data: null, error: new ApiError("Still working. Check back in a few minutes.") };
      }
      return { data: body as T, error: null };
    } catch {
      return { data: null, error: new ApiError("We couldn't reach AfriVogue. Check your connection and try again.") };
    }
  },
};

/* ───────────── live updates (polling via react-query; kept for API compatibility) ───────────── */

const channelStub = {
  on(..._args: unknown[]) {
    return channelStub;
  },
  subscribe() {
    return channelStub;
  },
};

export const api = {
  from,
  auth,
  storage,
  functions,
  async rpc(fn: string, params: Record<string, unknown> = {}) {
    try {
      const { status, body } = await post<{ data?: unknown; error?: string }>(`/api/rpc/${fn}`, params);
      return status >= 400 ? { data: null, error: failure(status, body, "Request failed") } : { data: body.data ?? null, error: null };
    } catch {
      return { data: null, error: new ApiError("Network error") };
    }
  },
  channel: (_name: string) => channelStub,
  removeChannel: (_channel: unknown) => undefined,
};
