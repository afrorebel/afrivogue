// First start on a fresh database: load AfriVogue's existing stories, forecasts, trivia,
// moodboard and shop from the seed files shipped next to the server.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { db } from "../data/adminDb";
import { query } from "./pool";
import { tableInfo } from "./registry";

const ORDER = ["categories", "site_settings", "products", "trends", "forecasts", "trivia_questions", "moodboard_items"];

export async function seedIfEmpty(seedDir: string) {
  if (!existsSync(seedDir)) return;
  const [{ n }] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM trends");
  if (Number(n) > 0) return;

  for (const table of ORDER) {
    const file = path.join(seedDir, `${table}.json.gz`);
    const info = tableInfo(table);
    if (!existsSync(file) || !info) continue;
    const rows = JSON.parse(gunzipSync(readFileSync(file)).toString("utf8")) as Record<string, unknown>[];
    // Keep only columns this database has.
    const clean = rows.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => info.columns[k])));
    let loaded = 0;
    for (let i = 0; i < clean.length; i += 100) {
      const { error } = await db.from(table).upsert(clean.slice(i, i + 100), { ignoreDuplicates: true });
      if (error) console.error(`[seed] ${table}:`, error.message);
      else loaded += Math.min(100, clean.length - i);
    }
    console.log(`[seed] ${table}: ${loaded} rows`);
  }
}
