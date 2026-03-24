import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  };
  for (const [kw, domain] of Object.entries(map)) {
    if (lower.includes(kw)) return domain;
  }
  return "Culture";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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

    for (const result of results) {
      const sourceContent = result.markdown || result.description || "";
      if (sourceContent.length < 100) {
        console.log("Skipping thin content:", result.url);
        continue;
      }

      // Step 2: AI generates forecast from source material
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a cultural futurist and strategic intelligence analyst for AFRIVOGUE — a luxury African fashion and culture platform. Your role is to synthesize source material into forward-looking cultural forecasts.

RULES:
- Forecasts must be forward-looking projections, NOT news summaries.
- Write with authority and analytical depth. No casual language or clichés.
- Each forecast should predict a specific cultural, market, or aesthetic shift.
- Evidence must cite the source material with specific data points or quotes.
- Implications should address what stakeholders (designers, investors, brands) should do.
- Title must be a bold, definitive prediction statement (max 80 chars).
- Assign appropriate time horizon based on the nature of the shift.
- Signal strength: "Definitive" if backed by hard data/multiple sources, "High Confidence" if strong indicators exist, "Early Signal" if emerging/speculative.

You MUST respond using the create_forecast function.`,
            },
            {
              role: "user",
              content: `Analyze this content and generate a cultural forecast for the African fashion/culture ecosystem. Source: "${result.title}" from ${result.url}\n\nContent:\n${sourceContent.slice(0, 3000)}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "create_forecast",
                description: "Create a cultural forecast based on analysis of source material",
                parameters: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Bold prediction statement, max 80 chars" },
                    projection: { type: "string", description: "200-400 word forward-looking analysis" },
                    evidence: { type: "string", description: "150-300 words citing data points and sources" },
                    implications: { type: "string", description: "150-300 words on strategic implications for stakeholders" },
                    domain: { type: "string", enum: DOMAINS },
                    horizon: { type: "string", enum: ["6Months", "1-2 Years", "3-5 Years"] },
                    signal_strength: { type: "string", enum: ["Definitive", "High Confidence", "Early Signal"] },
                    region: { type: "string", enum: ["Africa", "Diaspora", "Global"] },
                  },
                  required: ["title", "projection", "evidence", "implications", "domain", "horizon", "signal_strength", "region"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "create_forecast" } },
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("AI failed:", aiResponse.status, errText);
        if (aiResponse.status === 429) break;
        continue;
      }

      const aiData = await aiResponse.json();
      let forecastData: any;

      try {
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          forecastData = JSON.parse(toolCall.function.arguments);
        }
      } catch (e) {
        console.error("Failed to parse AI response:", e);
        continue;
      }

      if (!forecastData?.title || !forecastData?.projection) {
        console.error("Invalid AI output, skipping");
        continue;
      }

      if (existingTitles.has(forecastData.title.toLowerCase())) {
        console.log("Skipping duplicate:", forecastData.title);
        continue;
      }

      // Step 3: Save
      const { error: insertError } = await supabase.from("forecasts").insert({
        title: forecastData.title,
        projection: forecastData.projection,
        evidence: forecastData.evidence,
        implications: forecastData.implications,
        domain: forecastData.domain || detectDomain(sourceContent),
        horizon: forecastData.horizon || "1-2 Years",
        signal_strength: forecastData.signal_strength || "Early Signal",
        region: forecastData.region || "Global",
        published: true,
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        continue;
      }

      existingTitles.add(forecastData.title.toLowerCase());
      ingested++;
      console.log("Ingested forecast:", forecastData.title);
    }

    console.log(`Pipeline complete. Ingested ${ingested} new forecasts.`);
    return new Response(
      JSON.stringify({ success: true, ingested, query }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Pipeline error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
