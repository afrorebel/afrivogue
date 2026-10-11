import { requireAdminOrCron, UnauthorizedError } from "../_shared/auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateJson, mapLimited } from "../_shared/claude.ts";
import { AFRIVOGUE_VOICE, GEOS } from "../_shared/voice.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SEARCH_QUERIES = [
  "African fashion industry future predictions 2026 2027",
  "emerging African luxury market trends forecast",
  "African beauty industry growth projections",
  "African textile innovation sustainability future",
  "African diaspora cultural influence fashion forecast",
  "African digital fashion commerce future trends",
  "African art design movement emerging trends",
  "Black American fashion industry future predictions",
  "Hollywood celebrity fashion influence forecast 2026",
  "Black culture entertainment industry growth projections",
  "diaspora influence global luxury market future",
  "Afrobeats global music culture industry forecast",
  "Black beauty brands market growth predictions",
  "Caribbean culture fashion global influence forecast",
  "Black excellence luxury lifestyle emerging trends",
];

const DOMAINS = ["Fashion", "Beauty", "Luxury", "Art & Design", "Culture", "Digital", "Commerce", "Entertainment", "Lifestyle"];

function detectDomain(text: string): string {
  const lower = text.toLowerCase();
  const map: Record<string, string> = {
    fashion: "Fashion", beauty: "Beauty", luxury: "Luxury",
    art: "Art & Design", design: "Art & Design", culture: "Culture",
    digital: "Digital", ecommerce: "Commerce", commerce: "Commerce",
    textile: "Fashion", sustainability: "Commerce",
    entertainment: "Entertainment", celebrity: "Entertainment", hollywood: "Entertainment",
    music: "Entertainment", lifestyle: "Lifestyle", wellness: "Lifestyle",
  };
  for (const [kw, domain] of Object.entries(map)) {
    if (lower.includes(kw)) return domain;
  }
  return "Culture";
}

interface ForecastOutput {
  title: string;
  projection: string;
  evidence: string;
  implications: string;
  domain: string;
  horizon: string;
  signal_strength: string;
  region: string;
}

const FORECAST_BRIEF = `TASK: You are AfriVogue's cultural futurist. Turn source material into a forward-looking forecast, not a news summary.

- title: a bold, specific prediction under 80 characters ("Lagos tailoring will set the pace for quiet luxury by 2028").
- projection: 200 to 350 words on the shift we expect, who drives it and how it will show up in what people wear, buy and watch.
- evidence: 120 to 250 words grounded only in the source: its data points, names and attributed quotes, cited as markdown links. Never invent numbers.
- implications: 120 to 250 words on what designers, brands, creatives and investors should do now.
- horizon: how soon the shift becomes mainstream.
- signal_strength: "Definitive" when backed by hard data or several sources, "High Confidence" for strong indicators, "Early Signal" when it is emerging or speculative. Be honest; most single-source forecasts are not Definitive.`;

const FORECAST_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    projection: { type: "string" },
    evidence: { type: "string" },
    implications: { type: "string" },
    domain: { type: "string", enum: DOMAINS },
    horizon: { type: "string", enum: ["6 Months", "1–2 Years", "3–5 Years"] },
    signal_strength: { type: "string", enum: ["Definitive", "High Confidence", "Early Signal"] },
    region: { type: "string", enum: GEOS },
  },
  required: ["title", "projection", "evidence", "implications", "domain", "horizon", "signal_strength", "region"],
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

    const query = SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)];
    console.log("Forecast search:", query);

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
        tbs: "qdr:w", // last week — forecasts are less time-sensitive
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
      return new Response(JSON.stringify({ message: "No new content found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${results.length} results`);

    // Dedup
    const { data: existing } = await supabase
      .from("forecasts")
      .select("title")
      .order("created_at", { ascending: false })
      .limit(100);

    const existingTitles = new Set((existing || []).map((f: any) => f.title?.toLowerCase()));

    let ingested = 0;

    const candidates = results.filter((result: any) => {
      const sourceContent = result.markdown || result.description || "";
      if (sourceContent.length < 100) {
        console.log("Skipping thin content:", result.url);
        return false;
      }
      return true;
    });

    const forecasts = await mapLimited(candidates, 3, async (result: any) => {
      const sourceContent: string = result.markdown || result.description || "";
      const forecast = await generateJson<ForecastOutput>({
        system: `${AFRIVOGUE_VOICE}\n\n${FORECAST_BRIEF}`,
        prompt: `Write one AfriVogue cultural forecast grounded in this source. Cite it as a markdown link to ${result.url} in both the evidence and the implications.\n\nSource title: ${result.title}\nSource URL: ${result.url}\n\n<source_material>\n${sourceContent.slice(0, 12000)}\n</source_material>`,
        schema: FORECAST_SCHEMA,
        effort: "medium",
      });
      return { sourceContent, forecast };
    });

    for (const outcome of forecasts) {
      if (outcome.status === "rejected") {
        console.error("Forecast failed:", outcome.reason instanceof Error ? outcome.reason.message : outcome.reason);
        continue;
      }
      const { sourceContent, forecast } = outcome.value;
      if (!forecast.title || !forecast.projection) {
        console.error("Invalid AI output, skipping");
        continue;
      }
      if (existingTitles.has(forecast.title.toLowerCase())) {
        console.log("Skipping duplicate:", forecast.title);
        continue;
      }

      const { error: insertError } = await supabase.from("forecasts").insert({
        title: forecast.title,
        projection: forecast.projection,
        evidence: forecast.evidence,
        implications: forecast.implications,
        domain: forecast.domain || detectDomain(sourceContent),
        horizon: forecast.horizon || "1–2 Years",
        signal_strength: forecast.signal_strength || "Early Signal",
        region: forecast.region || "Global",
        published: true,
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        continue;
      }

      existingTitles.add(forecast.title.toLowerCase());
      ingested++;
      console.log("Ingested forecast:", forecast.title);
    }

    console.log(`Pipeline complete. Ingested ${ingested} new forecasts.`);
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
