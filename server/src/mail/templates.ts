// Branded HTML emails. Copy follows the AfriVogue voice; admins can override the
// subject, heading, body, button, footer, logo and colours per template in
// Admin → Email Templates (stored in site_settings.email_template_overrides).
import { config } from "../config";
import { query } from "../db/pool";

export type TemplateName = "welcome" | "contact-confirmation" | "order-receipt" | "password-reset" | "contact-notification" | "order-notification";

interface Override {
  subject?: string;
  heading?: string;
  body_text?: string;
  button_label?: string;
  footer_text?: string;
  logo_url?: string;
  primary_color?: string;
  font_family?: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const SAFE_COLOR = /^#[0-9a-f]{3,8}$/i;
const SAFE_FONT = /^[\w\s',-]+$/;

async function loadOverrides(name: string): Promise<Override> {
  try {
    const rows = await query<{ value: string | null }>("SELECT `value` FROM site_settings WHERE `key` = 'email_template_overrides' LIMIT 1");
    const all = rows[0]?.value ? (JSON.parse(rows[0].value) as Record<string, Override>) : {};
    const pick = (o: Override = {}) => Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v === "string" && v.trim()));
    return { ...pick(all._global), ...pick(all[name]) };
  } catch {
    return {};
  }
}

interface Content {
  preview: string;
  heading: string;
  paragraphs: string[];
  details?: { label: string; value: string }[];
  button?: { label: string; href: string };
  footer: string;
  subject: string;
  unsubscribeUrl?: string;
}

function layout(c: Content, o: Override): RenderedEmail {
  const gold = o.primary_color && SAFE_COLOR.test(o.primary_color) ? o.primary_color : "#D4A243";
  const display = o.font_family && SAFE_FONT.test(o.font_family) ? o.font_family : "'Playfair Display', Georgia, serif";
  const logo =
    o.logo_url && /^https?:\/\//.test(o.logo_url)
      ? `<img src="${esc(o.logo_url)}" alt="AfriVogue" height="36" style="display:block;height:36px;border:0" />`
      : `<span style="font-family:${display};font-style:italic;font-size:28px;color:#1A1710;letter-spacing:-0.5px">Afri<span style="color:${gold}">Vogue</span></span>`;
  const paragraphs = c.paragraphs
    .map((p) => `<p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#4A433C">${esc(p).replace(/\n/g, "<br />")}</p>`)
    .join("");
  const details = (c.details || [])
    .map(
      (d) => `<tr><td style="padding:10px 0;border-top:1px solid #EFE8DD">
        <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#998F85">${esc(d.label)}</div>
        <div style="font-size:15px;color:#1A1710;font-weight:600;margin-top:3px">${esc(d.value)}</div></td></tr>`,
    )
    .join("");
  const button = c.button
    ? `<p style="margin:26px 0 8px"><a href="${esc(c.button.href)}" style="display:inline-block;background:${gold};color:#1A1710;font-weight:700;font-size:14px;text-decoration:none;padding:13px 26px;border-radius:999px">${esc(c.button.label)}</a></p>`
    : "";
  const unsubscribe = c.unsubscribeUrl
    ? `<p style="margin:10px 0 0;font-size:11px;color:#B3AAA0"><a href="${esc(c.unsubscribeUrl)}" style="color:#B3AAA0">Unsubscribe</a></p>`
    : "";

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /><title>${esc(c.subject)}</title></head>
<body style="margin:0;padding:0;background:#F6F1EA;font-family:'DM Sans','Helvetica Neue',Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden">${esc(c.preview)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F1EA;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden">
<tr><td style="padding:30px 32px 0">${logo}</td></tr>
<tr><td style="padding:22px 32px 30px">
<h1 style="margin:0 0 18px;font-family:${display};font-style:italic;font-weight:600;font-size:28px;line-height:1.15;color:#1A1710">${esc(c.heading)}</h1>
${paragraphs}
${details ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 10px">${details}</table>` : ""}
${button}
<p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#998F85">${esc(c.footer)}</p>
</td></tr></table>
<p style="margin:18px 0 0;font-size:11px;color:#B3AAA0">AfriVogue · Fashion, culture and the stories behind them · <a href="${config.appUrl}" style="color:#B3AAA0">${config.appUrl.replace(/^https?:\/\//, "")}</a></p>
${unsubscribe}
</td></tr></table></body></html>`;

  const text = [
    c.heading,
    "",
    ...c.paragraphs.flatMap((p) => [p, ""]),
    ...(c.details || []).map((d) => `${d.label}: ${d.value}`),
    c.button ? `\n${c.button.label}: ${c.button.href}` : "",
    "",
    c.footer,
    c.unsubscribeUrl ? `\nUnsubscribe: ${c.unsubscribeUrl}` : "",
  ].join("\n");

  return { subject: c.subject, html, text };
}

/** Admin overrides replace the default copy wherever they are set. */
function applyOverride(c: Content, o: Override): Content {
  return {
    ...c,
    subject: o.subject || c.subject,
    heading: o.heading || c.heading,
    paragraphs: o.body_text ? o.body_text.split(/\n{2,}/) : c.paragraphs,
    button: c.button ? { ...c.button, label: o.button_label || c.button.label } : undefined,
    footer: o.footer_text || c.footer,
  };
}

export async function renderEmail(name: TemplateName, data: Record<string, unknown> = {}): Promise<RenderedEmail> {
  const first = typeof data.name === "string" && data.name.trim() ? data.name.trim().split(/\s+/)[0] : "";
  let content: Content;
  switch (name) {
    case "welcome":
      content = {
        subject: "Welcome to the AfriVogue Collective",
        preview: "Your seat at the table is saved.",
        heading: first ? `Welcome in, ${first}.` : "Welcome in.",
        paragraphs: [
          "You just joined a community of people who take African and diaspora style seriously, and who like to know what a moment means, not only that it happened.",
          "Start with today's stories, save the looks you love to your moodboard, play the Daily Five on AfriTrivia, and ask the Style Concierge what to wear to whatever is next on your calendar.",
          ...(data.confirmUrl ? ["One last thing: tap below to confirm this is your email, so you never miss a note from us."] : []),
        ],
        button: data.confirmUrl
          ? { label: "Confirm my email", href: String(data.confirmUrl) }
          : { label: "Open AfriVogue", href: config.appUrl },
        footer: "We're glad you're here. — The AfriVogue editors",
      };
      break;
    case "contact-confirmation":
      content = {
        subject: "We got your message",
        preview: "A real person will read it and reply.",
        heading: first ? `Thank you, ${first}.` : "Thank you for writing.",
        paragraphs: [
          `Your message${data.subject ? ` about "${String(data.subject)}"` : ""} reached our editors. A real person reads every note, and we usually reply within two working days.`,
          "In the meantime, today's stories are waiting for you.",
        ],
        button: { label: "Read today's stories", href: `${config.appUrl}/trends` },
        footer: "— The AfriVogue team",
      };
      break;
    case "contact-notification":
      content = {
        subject: `New message: ${String(data.subject || "General")} — ${String(data.name || "")}`,
        preview: String(data.message || "").slice(0, 90),
        heading: "New contact message",
        paragraphs: [String(data.message || "")],
        details: [
          { label: "From", value: `${String(data.name || "")} <${String(data.email || "")}>` },
          { label: "Subject", value: String(data.subject || "General") },
        ],
        footer: "Reply to this email to answer them directly. Messages are also saved in Admin → Messages.",
      };
      break;
    case "order-receipt":
      content = {
        subject: data.orderNumber ? `Your AfriVogue order #${String(data.orderNumber)}` : "Your AfriVogue order",
        preview: "Thank you. Your order is confirmed.",
        heading: "Your order is confirmed.",
        paragraphs: [
          "Thank you for shopping with us. Every piece in our shop is chosen by our editors, and many come straight from independent makers.",
          "We'll email you again as soon as your order is on its way.",
        ],
        details: [
          ...(data.orderNumber ? [{ label: "Order", value: `#${String(data.orderNumber)}` }] : []),
          ...(data.items ? [{ label: "Items", value: String(data.items) }] : []),
          ...(data.total ? [{ label: "Total", value: `$${String(data.total)}` }] : []),
        ],
        button: { label: "Keep browsing the shop", href: `${config.appUrl}/shop` },
        footer: "Questions about your order? Just reply to this email.",
      };
      break;
    case "order-notification":
      content = {
        subject: `New order #${String(data.orderNumber || "")} — $${String(data.total || "")}`,
        preview: String(data.items || ""),
        heading: "A new order came in",
        paragraphs: ["A shop order was paid."],
        details: [
          { label: "Order", value: `#${String(data.orderNumber || "")}` },
          { label: "Customer", value: String(data.email || "") },
          { label: "Items", value: String(data.items || "") },
          { label: "Total", value: `$${String(data.total || "")}` },
        ],
        button: { label: "Open the admin", href: `${config.appUrl}/admin` },
        footer: "Sent automatically by AfriVogue.",
      };
      break;
    case "password-reset":
      content = {
        subject: "Reset your AfriVogue password",
        preview: "This link works for one hour.",
        heading: "Let's get you back in.",
        paragraphs: [
          "Someone (hopefully you) asked to reset the password for your AfriVogue account. Tap the button below to choose a new one. The link works for one hour.",
          "If you didn't ask for this, you can ignore this email and your password stays the same.",
        ],
        button: { label: "Choose a new password", href: String(data.url || config.appUrl) },
        footer: "— The AfriVogue team",
      };
      break;
  }
  const internal = name === "contact-notification" || name === "order-notification" || name === "password-reset";
  const override = internal ? {} : await loadOverrides(name);
  return layout(applyOverride(content, override), override);
}
