// Server actions the site calls by name: api.functions.invoke("create-checkout", { body })
// arrives here as POST /api/functions/create-checkout.
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { Router, type Request } from "express";
import { requireAdmin, requireAdminOrCron, requireUser } from "./auth";
import { config } from "./config";
import { clientKey, dailyAllowance, styleLook, usedToday, type ConciergeTier } from "./content/concierge";
import { enrichContent, ingestForecasts, ingestMoodboard, ingestTrends, ingestTrivia } from "./content/pipelines";
import { execute, query } from "./db/pool";
import { HttpError, clientIp, handle, isEmail, rateLimit } from "./http";
import { getJob, startJob } from "./jobs";
import { sendMail } from "./mail/mailer";
import { renderEmail, type TemplateName } from "./mail/templates";
import { checkSubscription, createPortalSession, createShopCheckout, createSubscriptionCheckout } from "./shop";

/* ───────────── unsubscribe links ───────────── */

const sign = (email: string) => createHmac("sha256", config.appSecret || "afrivogue").update(email.toLowerCase()).digest("base64url");

export function unsubscribeUrl(email: string) {
  const token = `${Buffer.from(email.toLowerCase()).toString("base64url")}.${sign(email)}`;
  return `${config.appUrl}/unsubscribe?token=${token}`;
}

function emailFromToken(token: unknown): string | null {
  const [encoded, mac] = String(token || "").split(".");
  if (!encoded || !mac) return null;
  const email = Buffer.from(encoded, "base64url").toString("utf8");
  const expected = Buffer.from(sign(email));
  const given = Buffer.from(mac);
  return expected.length === given.length && timingSafeEqual(expected, given) ? email : null;
}

/* ───────────── content jobs ───────────── */

export const CONTENT_JOBS: Record<string, (body: Record<string, unknown>) => Promise<unknown>> = {
  "ingest-trends": () => ingestTrends(),
  "ingest-forecasts": () => ingestForecasts(),
  "ingest-moodboard": () => ingestMoodboard(),
  "ingest-trivia": () => ingestTrivia(),
  "enrich-content": (body) => enrichContent(body),
};

/* ───────────── concierge tier ───────────── */

async function conciergeTier(req: Request): Promise<ConciergeTier> {
  if (!req.user) return "guest";
  if (req.principal.isAdmin) return "insider";
  try {
    return (await checkSubscription(req.user)).subscribed ? "insider" : "collective";
  } catch {
    return "collective";
  }
}

/* ───────────── router ───────────── */

type Handler = (req: Request, body: Record<string, unknown>) => Promise<unknown>;

const FUNCTIONS: Record<string, Handler> = {
  "check-subscription": async (req) => checkSubscription(requireUser(req)),

  "create-checkout": async (req, body) => createSubscriptionCheckout(requireUser(req), body.plan),

  "create-shop-checkout": async (req, body) => createShopCheckout(requireUser(req), body as never),

  "customer-portal": async (req) => createPortalSession(requireUser(req)),

  contact: async (req, body) => {
    const name = String(body.name || "").trim().slice(0, 120);
    const email = String(body.email || "").trim().toLowerCase();
    const subject = String(body.subject || "").trim().slice(0, 200);
    const message = String(body.message || "").trim().slice(0, 5000);
    if (!name || !message || !isEmail(email)) throw new HttpError(400, "Please add your name, a valid email and a message.");
    await execute("INSERT INTO contact_messages (id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)", [
      randomUUID(),
      name,
      email,
      subject || null,
      message,
    ]);
    const confirmation = await renderEmail("contact-confirmation", { name, subject });
    void sendMail({ to: email, ...confirmation, kind: "account" });
    if (config.smtp.inbox) {
      const note = await renderEmail("contact-notification", { name, email, subject, message });
      void sendMail({ to: config.smtp.inbox, replyTo: email, ...note, kind: "account" });
    }
    return { ok: true };
  },

  // Admin → Email Templates → "Send test" (to the admin's own inbox only).
  "send-transactional-email": async (req, body) => {
    requireAdmin(req);
    const name = String(body.templateName || "") as TemplateName;
    if (!["welcome", "contact-confirmation", "order-receipt"].includes(name)) throw new HttpError(400, "Unknown template.");
    const sample: Record<string, unknown> = { name: "Amara", subject: "Collaboration", orderNumber: "A7B3C9", total: "89.00", items: "Adire Wrap Dress ×1" };
    const mail = await renderEmail(name, sample);
    const sent = await sendMail({ to: req.user!.email, ...mail, subject: `[Test] ${mail.subject}`, kind: "account" });
    if (!sent) throw new HttpError(503, "Email isn't set up yet. Add the SMTP settings in hPanel and try again.");
    return { ok: true };
  },

  "handle-email-unsubscribe": async (_req, body) => {
    const email = emailFromToken(body.token);
    if (!email) throw new HttpError(404, "Invalid or expired link");
    const already = await query("SELECT 1 FROM email_suppressions WHERE email = ? LIMIT 1", [email]);
    if (body.check) return already.length ? { valid: false, reason: "already_unsubscribed" } : { valid: true };
    await execute("INSERT IGNORE INTO email_suppressions (email, reason) VALUES (?, 'unsubscribe')", [email]);
    await execute("DELETE FROM newsletter_subscribers WHERE email = ?", [email]);
    return { success: true };
  },

  "style-concierge": async (req, body) => {
    const tier = await conciergeTier(req);
    const key = clientKey(req.user?.id ?? null, clientIp(req), req.get("user-agent") || "");
    return styleLook({ occasion: body.occasion, details: body.details, previous: body.previous, key, userId: req.user?.id ?? null, tier });
  },

  "style-concierge-status": async (req) => {
    const tier = await conciergeTier(req);
    const key = clientKey(req.user?.id ?? null, clientIp(req), req.get("user-agent") || "");
    const allowance = dailyAllowance(tier);
    return { tier, allowance, remaining: Math.max(0, allowance - (await usedToday(key))), available: !!config.anthropicApiKey };
  },
};

export const functionsRouter = Router();

functionsRouter.post(
  "/:name",
  rateLimit("functions", 120, 60 * 1000),
  handle(async (req, res) => {
    const name = String(req.params.name);
    const body = req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : {};

    const job = CONTENT_JOBS[name];
    if (job) {
      requireAdminOrCron(req);
      const started = startJob(name, () => job(body));
      return res.status(202).json({ job: started.id, status: started.status });
    }

    const fn = FUNCTIONS[name];
    if (!fn) throw new HttpError(404, `Unknown function "${name}"`);
    if (name === "contact" || name === "style-concierge") {
      // Extra brake on the two public endpoints that send email or spend Claude credit.
      await new Promise<void>((resolve, reject) => contactLimiter(req, res, (err?: unknown) => (err ? reject(err) : resolve())));
      if (res.headersSent) return;
    }
    res.json(await fn(req, body));
  }),
);

const contactLimiter = rateLimit("public-actions", 10, 10 * 60 * 1000);

export const jobsRouter = Router();

jobsRouter.get(
  "/:id",
  handle(async (req, res) => {
    requireAdminOrCron(req);
    const job = getJob(String(req.params.id));
    if (!job) throw new HttpError(404, "That job has finished and expired. Refresh to see the results.");
    res.json(job);
  }),
);
