// Style Concierge: tell it the occasion, get a complete look in the AfriVogue voice,
// linked to our own stories and shop. Guests get a taste, the free Collective gets more,
// Insiders get it on tap.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHash, randomUUID } from "node:crypto";
import { config } from "../config";
import { db } from "../data/adminDb";
import { execute, query } from "../db/pool";
import { HttpError } from "../http";
import { generateJson } from "./claude";
import { AFRIVOGUE_VOICE } from "./voice";

export type ConciergeTier = "guest" | "collective" | "insider";

export const dailyAllowance = (tier: ConciergeTier) =>
  tier === "insider" ? config.conciergeDailyMember : tier === "collective" ? config.conciergeDailyFree : config.conciergeDailyGuest;

export interface ConciergeLook {
  title: string;
  mood: string;
  pieces: { item: string; why: string }[];
  palette: { name: string; hex: string }[];
  beauty: string;
  accessories: string;
  makers_note: string;
  pro_tip: string;
  avoid: string;
  search_terms: string[];
}

const CONCIERGE_BRIEF = `You are the AfriVogue Style Concierge: a warm, sharp personal stylist with an editor's eye, fluent in African and diaspora fashion. People tell you where they are going and you dress them.

HOW YOU STYLE
- Build one complete, wearable look for the occasion, the setting and any details given (city, weather, budget, dress code, body or comfort notes, what they already own).
- Celebrate African and diaspora design: fabrics like aso-oke, adire, kente, bogolan, kanga, shweshwe and ankara where they suit the moment, modern tailoring, and independent makers. Never costume-y, never stereotypical; mix with global pieces when that is the most stylish answer.
- Be specific: cut, colour, fabric, length, shoe shape. Explain why each piece works in one short line.
- Respect budget. If someone says "small budget", favour thrift, tailoring and pieces they can rewear.
- Name a real designer or brand only when you are confident it exists and fits; otherwise describe the kind of maker to look for ("a Lagos tailor who does sharp agbada cuts"). Never invent brands.
- Palette: 3 to 5 colours with accurate hex codes.
- makers_note: one sentence nudging them toward a local tailor, market or independent label.
- pro_tip: one insider styling trick for this look. avoid: one thing to skip for this occasion.
- search_terms: 2 to 4 short keywords (e.g. "aso-oke", "wedding guest", "tailoring") to find related stories and products.
- Tone: like a stylish friend who knows everyone. Short, confident sentences. No hashtags, no emoji.
- If the request isn't about style, dressing, beauty or grooming, gently steer back to what to wear.`;

const LOOK_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "A short, magazine-style name for the look" },
    mood: { type: "string", description: "One or two sentences painting the overall feel" },
    pieces: {
      type: "array",
      items: {
        type: "object",
        properties: { item: { type: "string" }, why: { type: "string" } },
        required: ["item", "why"],
        additionalProperties: false,
      },
    },
    palette: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, hex: { type: "string" } },
        required: ["name", "hex"],
        additionalProperties: false,
      },
    },
    beauty: { type: "string" },
    accessories: { type: "string" },
    makers_note: { type: "string" },
    pro_tip: { type: "string" },
    avoid: { type: "string" },
    search_terms: { type: "array", items: { type: "string" } },
  },
  required: ["title", "mood", "pieces", "palette", "beauty", "accessories", "makers_note", "pro_tip", "avoid", "search_terms"],
  additionalProperties: false,
};

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** Who is asking: signed-in users by id; guests by a hash of their IP and browser. */
export function clientKey(userId: string | null, ip: string, userAgent: string) {
  return userId ? `u:${userId}` : `g:${createHash("sha256").update(`${ip}|${userAgent}|${config.appSecret}`).digest("hex").slice(0, 40)}`;
}

export async function usedToday(key: string): Promise<number> {
  const rows = await query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM concierge_usage WHERE client_key = ? AND created_at >= UTC_DATE()",
    [key],
  );
  return Number(rows[0]?.n || 0);
}

export async function styleLook(input: {
  occasion: unknown;
  details?: unknown;
  previous?: unknown;
  key: string;
  userId: string | null;
  tier: ConciergeTier;
}) {
  const occasion = clean(input.occasion, 300);
  if (occasion.length < 3) throw new HttpError(400, "Tell us where you're going first.");
  const d = (input.details && typeof input.details === "object" ? input.details : {}) as Record<string, unknown>;
  const details = [
    ["City", clean(d.city, 60)],
    ["Budget", clean(d.budget, 60)],
    ["Vibe", clean(d.vibe, 80)],
    ["Notes", clean(d.notes, 300)],
  ].filter(([, v]) => v);
  const previous = clean(input.previous, 200);

  if (!config.anthropicApiKey) throw new HttpError(503, "The Style Concierge is resting. Please try again soon.");

  const allowance = dailyAllowance(input.tier);
  const used = await usedToday(input.key);
  if (used >= allowance) {
    const next =
      input.tier === "guest"
        ? "Join the Collective free to unlock more looks every day."
        : input.tier === "collective"
          ? "Become an Insider for a look whenever you need one."
          : "You've reached today's limit. Fresh looks tomorrow.";
    throw new HttpError(429, `That's all your looks for today. ${next}`);
  }
  // Count the attempt before calling Claude so parallel requests can't slip past the limit.
  await execute("INSERT INTO concierge_usage (id, user_id, client_key) VALUES (?, ?, ?)", [randomUUID(), input.userId, input.key]);

  const prompt = [
    `<occasion>${occasion}</occasion>`,
    details.length ? `<details>\n${details.map(([k, v]) => `${k}: ${v}`).join("\n")}\n</details>` : "",
    previous ? `They saw a look called "${previous}" and want a different take this time.` : "",
    "Style them.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const look = await generateJson<ConciergeLook>({
    system: `${AFRIVOGUE_VOICE}\n\n${CONCIERGE_BRIEF}`,
    prompt,
    schema: LOOK_SCHEMA,
    effort: "low",
    maxTokens: 6000,
  });
  look.palette = look.palette.filter((p) => /^#[0-9a-f]{6}$/i.test(p.hex)).slice(0, 5);
  look.pieces = look.pieces.slice(0, 7);

  const related = await findRelated(look.search_terms || []);
  return { look, related, remaining: Math.max(0, allowance - used - 1), allowance, tier: input.tier };
}

/** Our own stories and shop pieces that match the look. */
async function findRelated(terms: string[]) {
  const words = terms
    .flatMap((t) => String(t).toLowerCase().split(/[^a-z0-9-]+/))
    .filter((w) => w.length >= 4)
    .slice(0, 6);
  if (!words.length) return { stories: [], products: [] };
  const like = (col: string) => words.map((w) => `${col}.ilike.*${w}*`).join(",");
  const [stories, products] = await Promise.all([
    db
      .from("trends")
      .select("id, headline, category, featured_image_url")
      .eq("published", true)
      .or(`${like("headline")},${like("cultural_significance")}`)
      .order("created_at", { ascending: false })
      .limit(3),
    db
      .from("products")
      .select("id, name, price, images")
      .eq("published", true)
      .or(`${like("name")},${like("description")}`)
      .limit(3),
  ]);
  return { stories: (stories.data as any[]) || [], products: (products.data as any[]) || [] };
}
