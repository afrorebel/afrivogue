import { requireAdminOrCron, UnauthorizedError } from "../_shared/auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateJson, mapLimited } from "../_shared/claude.ts";
import { AFRIVOGUE_VOICE, CATEGORIES, GEOS, URGENCIES } from "../_shared/voice.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SEARCH_QUERIES = [
  "African fashion trends 2026",
  "African luxury fashion designers emerging",
  "African beauty industry innovation",
  "African art design culture contemporary",
  "African diaspora fashion business news",
  "African textile fashion sustainability luxury",
  "Black celebrity fashion style 2026",
  "Hollywood Black celebrity red carpet fashion",
  "Black American designer fashion luxury brand",
  "trending Black celebrity news entertainment",
  "Black culture entertainment fashion lifestyle global",
  "Beyonce Rihanna fashion style news",
  "Black British fashion designers London",
  "Afrobeats fashion culture global influence",
  "Black excellence luxury lifestyle entertainment",
  "Caribbean fashion culture diaspora trends",
];

const CATEGORIES_MAP: Record<string, string> = {
  fashion: "Fashion",
  beauty: "Beauty",
  luxury: "Luxury",
  art: "Art & Design",
  design: "Art & Design",
  culture: "Culture",
  business: "Business",
  textile: "Fashion",
  sustainability: "Business",
  diaspora: "Culture",
  entertainment: "Entertainment",
  celebrity: "Entertainment",
  hollywood: "Entertainment",
  music: "Entertainment",
  lifestyle: "Lifestyle",
  wellness: "Lifestyle",
  travel: "Lifestyle",
};

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORIES_MAP)) {
    if (lower.includes(keyword)) return category;
  }
  return "Culture";
}

function detectUrgency(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("breaking") || lower.includes("just announced") || lower.includes("launches")) return "Breaking";
  if (lower.includes("emerging") || lower.includes("rising") || lower.includes("new")) return "Emerging";
  return "Slow-Burn";
}

function detectGeo(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("diaspora") || lower.includes("abroad")) return "Diaspora";
  if (lower.includes("global") || lower.includes("international") || lower.includes("world")) return "Global";
  return "Africa";
}

interface StoryOutput {
  headline: string;
  cultural_significance: string;
  category: string;
  urgency: string;
  geo_relevance: string;
  content_tier: string;
  image_hint: string;
}

const STORY_BRIEF = `TASK: Turn one source article into an AfriVogue story.

STRUCTURE
- Headline: magnetic, under 80 characters, reads like a magazine cover line, includes the key name or subject for search.
- Body (cultural_significance): 300 to 500 words in 4 to 6 paragraphs separated by blank lines. Paragraph one sets the scene. The middle explains what happened, who made it and why it matters culturally. The last paragraph looks ahead.
- content_tier: "Daily Brief" for a timely cultural signal; "Editorial Feature" when the subject has enough depth for a long-form follow-up; "Premium Long-Form" only for a major cultural essay subject.
- image_hint: 2 to 3 words describing the ideal image.`;

const STORY_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string", description: "Cover-line headline, under 80 characters" },
    cultural_significance: { type: "string", description: "300-500 word story, paragraphs separated by blank lines, markdown links for citations" },
    category: { type: "string", enum: CATEGORIES },
    urgency: { type: "string", enum: URGENCIES },
    geo_relevance: { type: "string", enum: GEOS },
    content_tier: { type: "string", enum: ["Daily Brief", "Editorial Feature", "Premium Long-Form"] },
    image_hint: { type: "string", description: "2-3 word image description" },
  },
  required: ["headline", "cultural_significance", "category", "urgency", "geo_relevance", "content_tier", "image_hint"],
  additionalProperties: false,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await requireAdminOrCron(req);

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    if (!Deno.env.get("ANTHROPIC_API_KEY")) throw new Error("ANTHROPIC_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Pick a random search query each run to vary content
    const query = SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)];
    console.log("Searching for:", query);

    // Step 1: Firecrawl Search
    const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit: 5,
        tbs: "qdr:d", // last 24 hours
        scrapeOptions: { formats: ["markdown"] },
      }),
    });

    const searchData = await searchRes.json();
    if (!searchRes.ok) {
      console.error("Firecrawl search error:", searchData);
      throw new Error(`Firecrawl search failed: ${searchRes.status}`);
    }

    const results = searchData.data || [];
    if (results.length === 0) {
      console.log("No results found for query:", query);
      return new Response(JSON.stringify({ message: "No new content found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${results.length} results`);

    // Get existing headlines for dedup
    const { data: existing } = await supabase
      .from("trends")
      .select("headline, source_url")
      .order("created_at", { ascending: false })
      .limit(100);

    const existingHeadlines = new Set((existing || []).map((t: any) => t.headline?.toLowerCase()));
    const existingUrls = new Set((existing || []).map((t: any) => t.source_url).filter(Boolean));

    let ingested = 0;

    // Keep only fresh, substantial results before spending tokens on them.
    const candidates = results.filter((result: any) => {
      if (result.url && existingUrls.has(result.url)) {
        console.log("Skipping duplicate URL:", result.url);
        return false;
      }
      const sourceContent = result.markdown || result.description || "";
      if (sourceContent.length < 100) {
        console.log("Skipping thin content:", result.url);
        return false;
      }
      return true;
    });

    // Rewrite in parallel (bounded) so a full batch fits inside the function time limit.
    const rewrites = await mapLimited(candidates, 3, async (result: any) => {
      const sourceContent: string = result.markdown || result.description || "";
      const story = await generateJson<StoryOutput>({
        system: `${AFRIVOGUE_VOICE}\n\n${STORY_BRIEF}`,
        prompt: `Write an AfriVogue story from this source.\n\nSource title: ${result.title}\nSource URL: ${result.url}\n\n<source_material>\n${sourceContent.slice(0, 12000)}\n</source_material>`,
        schema: STORY_SCHEMA,
        effort: "medium",
      });
      return { result, sourceContent, story };
    });

    for (const outcome of rewrites) {
      if (outcome.status === "rejected") {
        console.error("Rewrite failed:", outcome.reason instanceof Error ? outcome.reason.message : outcome.reason);
        continue;
      }
      const { result, sourceContent, story } = outcome.value;

      if (!story.headline || !story.cultural_significance) {
        console.error("Invalid AI output, skipping");
        continue;
      }
      if (existingHeadlines.has(story.headline.toLowerCase())) {
        console.log("Skipping duplicate headline:", story.headline);
        continue;
      }

      const tier = story.content_tier || "Daily Brief";
      const isEditorial = tier === "Editorial Feature" || tier === "Premium Long-Form";

      const { error: insertError } = await supabase.from("trends").insert({
        headline: story.headline,
        cultural_significance: story.cultural_significance,
        category: story.category || detectCategory(sourceContent),
        urgency: story.urgency || detectUrgency(sourceContent),
        geo_relevance: story.geo_relevance || detectGeo(sourceContent),
        content_tier: tier,
        image_hint: story.image_hint || "",
        source_url: result.url || "",
        source_name: result.title?.split(" - ").pop()?.trim() || new URL(result.url).hostname,
        featured_image_url: result.metadata?.ogImage || result.metadata?.image || null,
        // Features are held for review and enriched into long-form by enrich-content.
        published: isEditorial ? false : true,
        needs_review: true,
        original_source_content: sourceContent.slice(0, 12000),
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        continue;
      }

      existingHeadlines.add(story.headline.toLowerCase());
      existingUrls.add(result.url);
      ingested++;
      console.log("Ingested:", story.headline);
    }

    console.log(`Pipeline complete. Ingested ${ingested} new trends.`);
    return new Response(
      JSON.stringify({ success: true, ingested, query }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.error("Pipeline error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
