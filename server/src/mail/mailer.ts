// Sends email through the Hostinger mailbox over SMTP (the same setup as foundright.ng).
// Set SMTP_HOST=smtp.hostinger.com, SMTP_PORT=465, SMTP_USER and SMTP_PASSWORD in hPanel.
import nodemailer, { type Transporter } from "nodemailer";
import { config } from "../config";
import { query } from "../db/pool";

let transporter: Transporter | null = null;

export const emailConfigured = () => !!(config.smtp.host && config.smtp.user && config.smtp.password);

function transport(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.password },
    });
  }
  return transporter;
}

export interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Marketing/community mail is skipped for unsubscribed addresses; account mail always sends. */
  kind?: "account" | "community";
  headers?: Record<string, string>;
}

export async function isSuppressed(email: string): Promise<boolean> {
  const rows = await query("SELECT 1 FROM email_suppressions WHERE email = ? LIMIT 1", [email.toLowerCase()]);
  return rows.length > 0;
}

/** Sends one email. Returns false (and logs) instead of throwing, so a mail hiccup never breaks a signup or checkout. */
export async function sendMail(mail: Mail): Promise<boolean> {
  if (!emailConfigured()) {
    console.warn(`[mail] SMTP not configured; skipped "${mail.subject}" to ${mail.to}`);
    return false;
  }
  try {
    if (mail.kind === "community" && (await isSuppressed(mail.to))) return false;
    await transport().sendMail({
      from: config.smtp.from,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      replyTo: mail.replyTo,
      headers: mail.headers,
    });
    return true;
  } catch (err) {
    console.error(`[mail] failed to send "${mail.subject}" to ${mail.to}:`, err instanceof Error ? err.message : err);
    return false;
  }
}
