// Turns AfriVogue stories into richer content with Claude.
//
//   POST { "mode": "editorial", "limit": 1 }           long-form editorial for features without one
//   POST { "mode": "editorial", "ids": ["<trend id>"] } (re)write specific stories as editorials
//   POST { "mode": "story", "limit": 4 }               re-voice short stories that predate the Claude pipeline
//
// Editorials are researched with extra Firecrawl sources when FIRECRAWL_API_KEY is set.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CLAUDE_MODEL, generateJson, mapLimited } from "../_shared/claude.ts";
import { AFRIVOGUE_VOICE, CATEGORIES } from "../_shared/voice.ts";
import { requireAdminOrCron, UnauthorizedError } from "../_shared/auth.ts";
import { renderEditorialHtml } from "../_shared/editorialHtml.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/* ───────────── editorial ───────────── */

interface EditorialOutput {
  headline: string;
  dek: string;
  intro: string[];
  sections: { heading: string; paragraphs: string[]; pull_quote: string }[];
  key_takeaways: string[];
  why_it_matters: string;
  sources: { title: string; url: string }[];
  seo_description: string;
  category: string;
}

const EDITORIAL_BRIEF = `TASK: Write a rich, long-form AfriVogue editorial, the kind of piece readers save, share and pay to keep reading.

LENGTH AND SHAPE
- 1,400 to 2,200 words in total.
- headline: under 90 characters, a magazine cover line that still names the subject.
- dek: the standfirst under the headline, 1 to 2 sentences that make the reader need to continue.
- intro: 2 to 3 paragraphs. Open on a scene, a detail or a tension, never a summary.
- sections: 4 to 6 sections, each with a short evocative heading and 2 to 4 paragraphs. Move from what happened, to who made it, to the history and context behind it, to what it means and what comes next. At least one section should give real context: the lineage, the craft, the market or the history that explains why this moment matters.
- pull_quote: one striking line per section, either an attributed quote from the sources or a sentence of our own from that section. Use "" for sections without one.
- key_takeaways: 3 to 5 crisp bullets a busy reader could forward to a friend.
- why_it_matters: 60 to 110 words on why this matters to the culture and to our readers.
- sources: every source you drew on, as { title, url }, using only URLs given in the material.
- seo_description: under 155 characters, plain and specific.

QUALITY BAR
- Depth over length. Every paragraph adds a fact, an insight or an image.
- Names, places, dates and numbers come only from the provided material.
- Paragraphs may include markdown links to the sources and *italics* for emphasis. No headings or lists inside paragraphs.`;

const EDITORIAL_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string" },
    dek: { type: "string" },
    intro: { type: "array", items: { type: "string" } },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          heading: { type: "string" },
          paragraphs: { type: "array", items: { type: "string" } },
          pull_quote: { type: "string" },
        },
        required: ["heading", "paragraphs", "pull_quote"],
        additionalProperties: false,
      },
    },
    key_takeaways: { type: "array", items: { type: "string" } },
    why_it_matters: { type: "string" },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: { title: { type: "string" }, url: { type: "string" } },
        required: ["title", "url"],
        additionalProperties: false,
      },
    },
    seo_description: { type: "string" },
    category: { type: "string", enum: CATEGORIES },
  },
  required: ["headline", "dek", "intro", "sections", "key_takeaways", "why_it_matters", "sources", "seo_description", "category"],
  additionalProperties: false,
};

/* ───────────── story re-voice ───────────── */

interface StoryOutput {
  headline: string;
  cultural_significance: string;
}

const STORY_REWRITE_BRIEF = `TASK: Re-write an existing AfriVogue story so it meets our current voice and quality bar.
- Keep every fact, name and source link that the material supports; drop anything it does not.
- headline: under 80 characters, a cover line that names the subject.
- cultural_significance: 300 to 500 words, 4 to 6 paragraphs separated by blank lines, scene-setting opening, forward-looking close, markdown links for citations.`;

const STORY_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string" },
    cultural_significance: { type: "string" },
  },
  required: ["headline", "cultural_significance"],
  additionalProperties: false,
};

const wordCount = (e: EditorialOutput) =>
  [...e.intro, ...e.sections.flatMap((s) => [s.heading, ...s.paragraphs])].join(" ").split(/\s+/).filter(Boolean).length;

/* ───────────── research ───────────── */

async function research(headline: string): Promise<{ title: string; url: string; markdown: string }[]> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) return [];
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: headline, limit: 3, scrapeOptions: { formats: ["markdown"] } }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || [])
      .filter((r: any) => (r.markdown || "").length > 300)
      .map((r: any) => ({ title: r.title || r.url, url: r.url, markdown: (r.markdown as string).slice(0, 6000) }));
  } catch {
    return [];
  }
}

/* ───────────── handler ───────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await requireAdminOrCron(req);
    if (!Deno.env.get("ANTHROPIC_API_KEY")) throw new Error("ANTHROPIC_API_KEY not configured");

    const body = await req.json().catch(() => ({}));
    const mode: "editorial" | "story" = body.mode === "story" ? "story" : "editorial";
    const ids: string[] | undefined = Array.isArray(body.ids) ? body.ids.slice(0, 5) : undefined;
    const limit = Math.min(Math.max(Number(body.limit) || (mode === "editorial" ? 1 : 4), 1), mode === "editorial" ? 3 : 8);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let query = supabase
      .from("trends")
      .select("id, headline, cultural_significance, category, content_tier, source_url, source_name, original_source_content, editorial_content")
      .order("created_at", { ascending: false });
    if (ids) {
      query = query.in("id", ids);
    } else if (mode === "editorial") {
      query = query.in("content_tier", ["Editorial Feature", "Premium Long-Form"]).is("editorial_content", null).limit(limit);
    } else {
      query = query.eq("content_tier", "Daily Brief").is("editorial_content", null).not("original_source_content", "is", null).limit(limit);
    }
    const { data: rows, error } = await query;
    if (error) throw error;
    if (!rows?.length) return json({ success: true, mode, processed: 0, message: "Nothing left to enrich" });

    const outcomes = await mapLimited(rows, 2, async (row: any) => {
      const sourceBlock = `<original_source url="${row.source_url || ""}" name="${row.source_name || ""}">\n${(row.original_source_content || "").slice(0, 12000)}\n</original_source>`;
      const current = `<current_story>\nHeadline: ${row.headline}\nCategory: ${row.category}\n\n${row.cultural_significance}\n</current_story>`;

      if (mode === "story") {
        const story = await generateJson<StoryOutput>({
          system: `${AFRIVOGUE_VOICE}\n\n${STORY_REWRITE_BRIEF}`,
          prompt: `${current}\n\n${sourceBlock}`,
          schema: STORY_SCHEMA,
          effort: "medium",
        });
        const { error: updateError } = await supabase
          .from("trends")
          .update({
            headline: story.headline,
            cultural_significance: story.cultural_significance,
            editorial_content: {
              rewrite: { previous_headline: row.headline, previous_text: row.cultural_significance },
              generated_by: CLAUDE_MODEL,
              generated_at: new Date().toISOString(),
              version: 2,
            },
          })
          .eq("id", row.id);
        if (updateError) throw updateError;
        return { id: row.id, headline: story.headline };
      }

      const extra = await research(row.headline);
      const researchBlock = extra
        .filter((r) => r.url !== row.source_url)
        .map((r) => `<research_source url="${r.url}" title="${r.title.replace(/"/g, "'")}">\n${r.markdown}\n</research_source>`)
        .join("\n\n");

      const editorial = await generateJson<EditorialOutput>({
        system: `${AFRIVOGUE_VOICE}\n\n${EDITORIAL_BRIEF}`,
        prompt: `Write the long-form AfriVogue editorial for this story.\n\n${current}\n\n${sourceBlock}\n\n${researchBlock}`,
        schema: EDITORIAL_SCHEMA,
        effort: "high",
        maxTokens: 48000,
      });

      const words = wordCount(editorial);
      const { error: updateError } = await supabase
        .from("trends")
        .update({
          headline: editorial.headline,
          content_tier: row.content_tier === "Premium Long-Form" ? "Premium Long-Form" : "Editorial Feature",
          editorial_content: {
            body: renderEditorialHtml(editorial),
            dek: editorial.dek,
            key_takeaways: editorial.key_takeaways,
            why_it_matters: editorial.why_it_matters,
            sources: editorial.sources.filter((s) => /^https?:\/\//.test(s.url)),
            seo_description: editorial.seo_description,
            reading_minutes: Math.max(3, Math.round(words / 230)),
            word_count: words,
            generated_by: CLAUDE_MODEL,
            generated_at: new Date().toISOString(),
            version: 2,
          },
        })
        .eq("id", row.id);
      if (updateError) throw updateError;
      return { id: row.id, headline: editorial.headline, words };
    });

    const done = outcomes.flatMap((o) => (o.status === "fulfilled" ? [o.value] : []));
    const failed = outcomes.flatMap((o, i) =>
      o.status === "rejected" ? [{ id: rows[i].id, error: o.reason instanceof Error ? o.reason.message : String(o.reason) }] : [],
    );
    failed.forEach((f) => console.error("Enrich failed:", f));

    return json({ success: true, mode, processed: done.length, done, failed });
  } catch (error) {
    if (error instanceof UnauthorizedError) return json({ error: error.message }, 401);
    console.error("enrich-content error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
