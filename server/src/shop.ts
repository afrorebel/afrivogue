// Stripe: Insider subscriptions, shop checkout, the billing portal and the webhook
// that marks orders paid and sends receipts.
/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { config } from "./config";
import { db } from "./data/adminDb";
import { HttpError } from "./http";
import type { PublicUser } from "./auth";
import { emailFor } from "./auth";
import { sendMail } from "./mail/mailer";
import { renderEmail } from "./mail/templates";

let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!config.stripe.secretKey) throw new HttpError(503, "Payments aren't switched on yet. Add STRIPE_SECRET_KEY in hPanel.");
  if (!client) client = new Stripe(config.stripe.secretKey);
  return client;
}

async function findCustomer(email: string) {
  const customers = await stripe().customers.list({ email, limit: 1 });
  return customers.data[0] ?? null;
}

/* ───────────── Insider subscription ───────────── */

export interface SubscriptionStatus {
  subscribed: boolean;
  product_id?: string | null;
  subscription_end?: string | null;
  manual?: boolean;
}

const statusCache = new Map<string, { at: number; value: SubscriptionStatus }>();

async function manualPremium(userId: string): Promise<boolean> {
  const { data } = await db.from("site_settings").select("value").eq("key", "manual_premium_users").maybeSingle();
  return Array.isArray(data?.value) && (data.value as string[]).includes(userId);
}

export async function checkSubscription(user: PublicUser, fresh = false): Promise<SubscriptionStatus> {
  const cached = statusCache.get(user.id);
  if (!fresh && cached && Date.now() - cached.at < 5 * 60 * 1000) return cached.value;

  let value: SubscriptionStatus = { subscribed: false };
  if (await manualPremium(user.id)) value = { subscribed: true, manual: true };
  else if (config.stripe.secretKey) {
    const customer = await findCustomer(user.email);
    if (customer) {
      const subs = await stripe().subscriptions.list({ customer: customer.id, status: "active", limit: 1 });
      const sub: any = subs.data[0];
      if (sub) {
        const end = sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end;
        value = {
          subscribed: true,
          product_id: String(sub.items?.data?.[0]?.price?.product ?? ""),
          subscription_end: end ? new Date(end * 1000).toISOString() : null,
        };
      }
    }
  }
  statusCache.set(user.id, { at: Date.now(), value });
  return value;
}

export const forgetSubscription = (userId: string) => statusCache.delete(userId);

export async function createSubscriptionCheckout(user: PublicUser, plan: unknown) {
  const price = plan === "yearly" ? config.stripe.priceYearly : plan === "monthly" ? config.stripe.priceMonthly : null;
  if (!price) throw new HttpError(400, "Please choose monthly or yearly.");
  const customer = await findCustomer(user.email);
  const session = await stripe().checkout.sessions.create({
    customer: customer?.id,
    customer_email: customer ? undefined : user.email,
    line_items: [{ price, quantity: 1 }],
    mode: "subscription",
    allow_promotion_codes: true,
    success_url: `${config.appUrl}/dashboard?checkout=success`,
    cancel_url: `${config.appUrl}/membership`,
    metadata: { user_id: user.id, kind: "insider" },
  });
  forgetSubscription(user.id);
  return { url: session.url };
}

export async function createPortalSession(user: PublicUser) {
  const customer = await findCustomer(user.email);
  if (!customer) throw new HttpError(404, "We couldn't find a billing account for this email.");
  const session = await stripe().billingPortal.sessions.create({ customer: customer.id, return_url: `${config.appUrl}/dashboard` });
  forgetSubscription(user.id);
  return { url: session.url };
}

/* ───────────── shop ───────────── */

interface CartLine {
  product_id: string;
  quantity?: number;
  size?: string | null;
  color?: string | null;
}

// Countries we ship to (override with SHIP_COUNTRIES="NG,GH,US,...").
const SHIP_COUNTRIES = (
  process.env.SHIP_COUNTRIES ||
  "NG,GH,KE,ZA,RW,UG,TZ,SN,CI,CM,EG,MA,ET,BW,NA,ZM,US,CA,GB,IE,FR,DE,NL,BE,IT,ES,PT,SE,NO,DK,CH,AT,AU,NZ,AE,JM,TT,BB,BS,BR"
)
  .split(",")
  .map((c) => c.trim().toUpperCase())
  .filter(Boolean) as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];

export async function createShopCheckout(user: PublicUser, body: { items?: CartLine[]; discount_code?: string }) {
  const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  if (!items.length) throw new HttpError(400, "Your bag is empty.");

  const ids = [...new Set(items.map((i) => String(i.product_id)))];
  const { data: products, error } = await db.from("products").select("*").in("id", ids).eq("published", true);
  if (error) throw new Error(error.message);

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const orderItems: any[] = [];
  let subtotal = 0;
  for (const item of items) {
    const product: any = (products || []).find((p: any) => p.id === item.product_id);
    if (!product || product.product_type !== "custom") continue;
    const quantity = Math.min(Math.max(Math.floor(Number(item.quantity) || 1), 1), 20);
    const onSale = product.flash_sale && product.flash_sale_price && product.flash_sale_end && new Date(product.flash_sale_end) > new Date();
    const price = Number(onSale ? product.flash_sale_price : product.price);
    subtotal += price * quantity;
    const description = [item.size && `Size: ${item.size}`, item.color && `Colour: ${item.color}`].filter(Boolean).join(", ");
    const image = Array.isArray(product.images) ? product.images.find((u: unknown) => typeof u === "string" && /^https:\/\//.test(u)) : undefined;
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: product.name, description: description || undefined, images: image ? [image] : undefined },
        unit_amount: Math.round(price * 100),
      },
      quantity,
    });
    orderItems.push({ product_id: product.id, name: product.name, price, quantity, size: item.size ?? null, color: item.color ?? null });
  }
  if (!lineItems.length) throw new HttpError(400, "None of these items can be bought here right now.");

  // Discount codes are checked here, on the server, never trusted from the browser.
  let discountAmount = 0;
  let discountId: string | null = null;
  const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
  if (body.discount_code) {
    const { data: dc }: any = await db.from("discount_codes").select("*").eq("code", String(body.discount_code).toUpperCase()).eq("active", true).maybeSingle();
    const valid =
      dc &&
      (!dc.expires_at || new Date(dc.expires_at) > new Date()) &&
      (!dc.max_uses || (dc.times_used || 0) < dc.max_uses) &&
      (!dc.min_order || subtotal >= Number(dc.min_order));
    if (!valid) throw new HttpError(400, "That discount code isn't valid for this order.");
    discountAmount = dc.discount_type === "percentage" ? (subtotal * Number(dc.discount_value)) / 100 : Math.min(Number(dc.discount_value), subtotal);
    const coupon = await stripe().coupons.create(
      dc.discount_type === "percentage"
        ? { percent_off: Number(dc.discount_value), duration: "once" }
        : { amount_off: Math.round(Number(dc.discount_value) * 100), currency: "usd", duration: "once" },
    );
    discounts.push({ coupon: coupon.id });
    discountId = dc.id;
  }

  const customer = await findCustomer(user.email);
  const session = await stripe().checkout.sessions.create({
    customer: customer?.id,
    customer_email: customer ? undefined : user.email,
    line_items: lineItems,
    discounts: discounts.length ? discounts : undefined,
    mode: "payment",
    shipping_address_collection: { allowed_countries: SHIP_COUNTRIES },
    phone_number_collection: { enabled: true },
    success_url: `${config.appUrl}/shop?checkout=success`,
    cancel_url: `${config.appUrl}/shop`,
    metadata: { user_id: user.id, kind: "shop", discount_code_id: discountId || "" },
  });

  await db.from("orders").insert({
    user_id: user.id,
    items: orderItems,
    total: Math.round((subtotal - discountAmount) * 100) / 100,
    status: "pending",
    stripe_session_id: session.id,
  });
  return { url: session.url };
}

/* ───────────── webhook ───────────── */

export async function handleStripeWebhook(rawBody: Buffer, signature: string | undefined) {
  if (!config.stripe.webhookSecret) throw new HttpError(503, "STRIPE_WEBHOOK_SECRET is not set.");
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(rawBody, signature || "", config.stripe.webhookSecret);
  } catch {
    throw new HttpError(400, "Invalid signature");
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    if (userId) forgetSubscription(userId);
    if (session.mode === "payment" && session.payment_status === "paid") await markOrderPaid(session);
  }
  if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
    statusCache.clear();
  }
  return { received: true };
}

async function markOrderPaid(session: Stripe.Checkout.Session) {
  const { data: order }: any = await db.from("orders").select("*").eq("stripe_session_id", session.id).maybeSingle();
  if (!order || order.status === "paid") return; // unknown or already handled (Stripe retries webhooks)

  const shipping: any = (session as any).collected_information?.shipping_details || (session as any).shipping_details || null;
  await db
    .from("orders")
    .update({
      status: "paid",
      total: session.amount_total != null ? session.amount_total / 100 : order.total,
      shipping_address: shipping ? { name: shipping.name, phone: session.customer_details?.phone ?? null, ...shipping.address } : null,
    })
    .eq("id", order.id);

  const discountId = session.metadata?.discount_code_id;
  if (discountId) {
    const { data: dc }: any = await db.from("discount_codes").select("times_used").eq("id", discountId).maybeSingle();
    if (dc) await db.from("discount_codes").update({ times_used: (dc.times_used || 0) + 1 }).eq("id", discountId);
  }

  // Emptying the bag only makes sense once the money has arrived.
  await db.from("cart_items").delete().eq("user_id", order.user_id);

  const items = (Array.isArray(order.items) ? order.items : []).map((i: any) => `${i.name || "Item"} ×${i.quantity || 1}`).join(", ");
  const total = (session.amount_total != null ? session.amount_total / 100 : Number(order.total)).toFixed(2);
  const orderNumber = String(order.id).slice(0, 8).toUpperCase();
  const email = session.customer_details?.email || (await emailFor(order.user_id));
  if (email) {
    const receipt = await renderEmail("order-receipt", { orderNumber, items, total });
    await sendMail({ to: email, ...receipt, kind: "account" });
  }
  if (config.smtp.inbox) {
    const note = await renderEmail("order-notification", { orderNumber, items, total, email });
    await sendMail({ to: config.smtp.inbox, ...note, kind: "account" });
  }
}
