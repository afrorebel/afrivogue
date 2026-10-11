// Accounts and sessions. Passwords are bcrypt-hashed; the browser holds an
// httpOnly session cookie and the database stores only a hash of it.
import { createHash, randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { Router, type NextFunction, type Request, type Response } from "express";
import { config } from "./config";
import { execute, query } from "./db/pool";
import { toMysqlDatetime } from "./db/registry";
import type { Principal } from "./data/policies";
import { HttpError, handle, isEmail, parseCookies, rateLimit } from "./http";
import { sendMail } from "./mail/mailer";
import { renderEmail } from "./mail/templates";

const COOKIE = "av_session";
const SESSION_DAYS = 30;

export interface PublicUser {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
  email_confirmed_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  email_confirmed_at: string | null;
  user_metadata: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: PublicUser | null;
    principal: Principal;
  }
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const iso = (v: string | null) => (v ? (v.includes("T") ? v : v.replace(" ", "T") + "Z") : null);

function toPublic(u: UserRow): PublicUser {
  let meta: Record<string, unknown> = {};
  try {
    meta = u.user_metadata ? JSON.parse(u.user_metadata) : {};
  } catch {
    /* keep empty */
  }
  return {
    id: u.id,
    email: u.email,
    user_metadata: meta,
    email_confirmed_at: iso(u.email_confirmed_at),
    created_at: iso(u.created_at)!,
    last_sign_in_at: iso(u.last_sign_in_at),
  };
}

export async function isAdmin(userId: string): Promise<boolean> {
  const rows = await query("SELECT 1 FROM user_roles WHERE user_id = ? AND role = 'admin' LIMIT 1", [userId]);
  return rows.length > 0;
}

async function grantAdminIfListed(user: { id: string; email: string; email_confirmed_at: string | null }) {
  if (!user.email_confirmed_at || !config.adminEmails.includes(user.email.toLowerCase())) return;
  await execute("INSERT IGNORE INTO user_roles (id, user_id, role) VALUES (?, ?, 'admin')", [randomUUID(), user.id]);
}

/* ───────────── sessions ───────────── */

function setSessionCookie(res: Response, token: string) {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    maxAge: SESSION_DAYS * 24 * 3600 * 1000,
    path: "/",
  });
}

async function startSession(res: Response, userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  await execute("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", [sha256(token), userId, toMysqlDatetime(expires)]);
  await execute("UPDATE users SET last_sign_in_at = CURRENT_TIMESTAMP(3) WHERE id = ?", [userId]);
  setSessionCookie(res, token);
}

/** Attaches req.user and req.principal from the session cookie. */
export async function sessionMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.user = null;
  req.principal = { userId: null, isAdmin: false };
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (!token) return next();
  try {
    const rows = await query<UserRow>(
      "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP(3) LIMIT 1",
      [sha256(token)],
    );
    if (rows[0]) {
      req.user = toPublic(rows[0]);
      req.principal = { userId: rows[0].id, isAdmin: await isAdmin(rows[0].id) };
    }
    next();
  } catch (err) {
    next(err);
  }
}

export function requireUser(req: Request): PublicUser {
  if (!req.user) throw new HttpError(401, "Please sign in first.");
  return req.user;
}

export function requireAdmin(req: Request) {
  if (!req.principal.isAdmin) throw new HttpError(403, "Only admins can do this.");
}

/** Admin session, or a scheduled job presenting CRON_SECRET (header x-cron-secret or ?key=). */
export function requireAdminOrCron(req: Request) {
  const key = req.get("x-cron-secret") || (typeof req.query.key === "string" ? req.query.key : "");
  if (config.cronSecret && key && key === config.cronSecret) return;
  if (!req.user) throw new HttpError(401, "Sign in as an admin to run this.");
  requireAdmin(req);
}

/* ───────────── one-time tokens (password reset, email confirmation) ───────────── */

async function issueToken(userId: string, purpose: "reset" | "confirm", hours: number) {
  const token = randomBytes(32).toString("base64url");
  await execute("INSERT INTO auth_tokens (token_hash, user_id, purpose, expires_at) VALUES (?, ?, ?, ?)", [
    sha256(token),
    userId,
    purpose,
    toMysqlDatetime(new Date(Date.now() + hours * 3600 * 1000)),
  ]);
  return token;
}

async function consumeToken(token: string, purpose: "reset" | "confirm"): Promise<string | null> {
  const hash = sha256(String(token || ""));
  const rows = await query<{ user_id: string }>(
    "SELECT user_id FROM auth_tokens WHERE token_hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP(3) LIMIT 1",
    [hash, purpose],
  );
  if (!rows[0]) return null;
  const result = await execute("UPDATE auth_tokens SET used_at = CURRENT_TIMESTAMP(3) WHERE token_hash = ? AND used_at IS NULL", [hash]);
  return result.affectedRows ? rows[0].user_id : null;
}

/* ───────────── routes ───────────── */

function checkPassword(password: unknown): string {
  if (typeof password !== "string" || password.length < 8) throw new HttpError(400, "Use a password with at least 8 characters.");
  if (password.length > 200) throw new HttpError(400, "That password is too long.");
  return password;
}

export const authRouter = Router();
const slow = rateLimit("auth", 20, 10 * 60 * 1000);

authRouter.get(
  "/session",
  handle(async (req, res) => {
    res.json({ user: req.user ?? null, isAdmin: req.principal.isAdmin });
  }),
);

authRouter.post(
  "/signup",
  slow,
  handle(async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!isEmail(email)) throw new HttpError(400, "Please enter a valid email address.");
    const password = checkPassword(req.body?.password);
    const raw = req.body?.data && typeof req.body.data === "object" ? req.body.data : {};
    const displayName = typeof raw.display_name === "string" ? raw.display_name.trim().slice(0, 80) : "";
    const metadata = { display_name: displayName || undefined };

    const existing = await query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (existing.length) throw new HttpError(409, "An account with this email already exists. Try signing in instead.");

    const id = randomUUID();
    await execute("INSERT INTO users (id, email, password_hash, user_metadata) VALUES (?, ?, ?, ?)", [
      id,
      email,
      await bcrypt.hash(password, 11),
      JSON.stringify(metadata),
    ]);
    // Every account gets a public profile (display name, or the start of the email).
    await execute("INSERT IGNORE INTO profiles (id, display_name) VALUES (?, ?)", [id, displayName || email.split("@")[0]]);
    await startSession(res, id);

    const confirm = await issueToken(id, "confirm", 24 * 7);
    const mail = await renderEmail("welcome", { name: displayName, confirmUrl: `${config.appUrl}/api/auth/confirm?token=${confirm}` });
    void sendMail({ to: email, ...mail, kind: "account" });

    const [row] = await query<UserRow>("SELECT * FROM users WHERE id = ?", [id]);
    res.status(201).json({ user: toPublic(row), isAdmin: false });
  }),
);

authRouter.post(
  "/login",
  slow,
  handle(async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const [row] = await query<UserRow>("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
    if (!row || !(await bcrypt.compare(password, row.password_hash))) {
      throw new HttpError(400, "That email and password don't match. Try again or reset your password.");
    }
    await grantAdminIfListed(row);
    await startSession(res, row.id);
    res.json({ user: toPublic(row), isAdmin: await isAdmin(row.id) });
  }),
);

authRouter.post(
  "/logout",
  handle(async (req, res) => {
    const token = parseCookies(req.headers.cookie)[COOKIE];
    if (token) await execute("DELETE FROM sessions WHERE id = ?", [sha256(token)]);
    res.clearCookie(COOKIE, { path: "/" });
    res.json({ ok: true });
  }),
);

authRouter.post(
  "/recover",
  slow,
  handle(async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const [row] = await query<UserRow>("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
    if (row) {
      const token = await issueToken(row.id, "reset", 1);
      const mail = await renderEmail("password-reset", { url: `${config.appUrl}/auth?reset=${token}` });
      await sendMail({ to: row.email, ...mail, kind: "account" });
    }
    // Same answer either way, so the form can't be used to discover who has an account.
    res.json({ ok: true });
  }),
);

authRouter.post(
  "/reset",
  slow,
  handle(async (req, res) => {
    const password = checkPassword(req.body?.password);
    const userId = await consumeToken(req.body?.token, "reset");
    if (!userId) throw new HttpError(400, "This reset link has expired or was already used. Request a new one.");
    await execute("UPDATE users SET password_hash = ?, email_confirmed_at = COALESCE(email_confirmed_at, CURRENT_TIMESTAMP(3)) WHERE id = ?", [
      await bcrypt.hash(password, 11),
      userId,
    ]);
    // Sign out everywhere else, then sign in here.
    await execute("DELETE FROM sessions WHERE user_id = ?", [userId]);
    const [row] = await query<UserRow>("SELECT * FROM users WHERE id = ?", [userId]);
    await grantAdminIfListed(row);
    await startSession(res, userId);
    res.json({ user: toPublic(row), isAdmin: await isAdmin(userId) });
  }),
);

authRouter.post(
  "/password",
  handle(async (req, res) => {
    const user = requireUser(req);
    const password = checkPassword(req.body?.password);
    await execute("UPDATE users SET password_hash = ? WHERE id = ?", [await bcrypt.hash(password, 11), user.id]);
    res.json({ ok: true });
  }),
);

authRouter.get(
  "/confirm",
  handle(async (req, res) => {
    const userId = await consumeToken(String(req.query.token || ""), "confirm");
    if (!userId) return res.redirect(302, "/dashboard?confirmed=expired");
    await execute("UPDATE users SET email_confirmed_at = COALESCE(email_confirmed_at, CURRENT_TIMESTAMP(3)) WHERE id = ?", [userId]);
    const [row] = await query<UserRow>("SELECT * FROM users WHERE id = ?", [userId]);
    await grantAdminIfListed(row);
    res.redirect(302, "/dashboard?confirmed=1");
  }),
);

/** Mirrors the old has_role() database function: callers may only ask about themselves (admins about anyone). */
export async function hasRoleRpc(req: Request, params: Record<string, unknown>) {
  const userId = String(params._user_id || "");
  const role = String(params._role || "");
  if (!req.user || (userId !== req.user.id && !req.principal.isAdmin)) return false;
  const rows = await query("SELECT 1 FROM user_roles WHERE user_id = ? AND role = ? LIMIT 1", [userId, role]);
  return rows.length > 0;
}

/** Looks up a user's email (server-side only). */
export async function emailFor(userId: string): Promise<string | null> {
  const [row] = await query<{ email: string }>("SELECT email FROM users WHERE id = ? LIMIT 1", [userId]);
  return row?.email ?? null;
}
