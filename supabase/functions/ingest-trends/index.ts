import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    for (const result of results) {
      // Skip if URL already exists
      if (result.url && existingUrls.has(result.url)) {
        console.log("Skipping duplicate URL:", result.url);
        continue;
      }

      const sourceContent = result.markdown || result.description || "";
      if (sourceContent.length < 100) {
        console.log("Skipping thin content:", result.url);
        continue;
      }

      // Step 2: AI Rewrite with Lovable AI
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
              content: `You are the editorial voice of AFRIVOGUE — a global fashion, culture, entertainment, and lifestyle intelligence platform with an Afro-global soul. Afrivogue covers the FULL spectrum of Black culture worldwide: African creatives, the African diaspora, Black American celebrities, Hollywood, Caribbean culture, Afro-European movements, and their influence on global fashion, beauty, entertainment, and lifestyle.

Your tone is confident, visionary, and elegant, blending high-fashion authority (like Vogue and Business of Fashion) with cultural depth. Afrivogue is for EVERYONE — irrespective of race or location — who appreciates culture, style, and innovation through an African lens.

RULES:
- Write in refined, authoritative prose. No casual language, clichés, or emojis.
- Every piece must include at least one direct citation with a clickable source link.
- Include quotes from industry figures when present in the source material.
- Headlines must be magnetic, SEO-optimized, and under 80 characters.
- Cultural significance text should be 150-300 words, editorially rich.
- Cover African, diaspora, Black American, Caribbean, and global narratives with equal editorial weight.
- Celebrity and entertainment stories are welcome — frame them through cultural significance, not gossip.
- Assign the most fitting content_tier based on depth: "Daily Brief" for news, "Editorial Feature" for analysis, "Premium Long-Form" for deep dives.

You MUST respond with a JSON object using this exact schema:
{
  "headline": "string (max 80 chars, SEO-optimized)",
  "cultural_significance": "string (150-300 words, editorial prose with inline citations like [Source Name](url))",
  "category": "one of: Fashion, Beauty, Luxury, Art & Design, Culture, Business, Entertainment, Lifestyle",
  "urgency": "one of: Breaking, Emerging, Slow-Burn",
  "geo_relevance": "one of: Africa, Diaspora, Global",
  "content_tier": "one of: Daily Brief, Editorial Feature, Premium Long-Form",
  "image_hint": "string (2-3 word image search hint)"
}`,
            },
            {
              role: "user",
              content: `Rewrite this article in the AFRIVOGUE editorial voice. Source: "${result.title}" from ${result.url}\n\nContent:\n${sourceContent.slice(0, 3000)}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "create_trend",
                description: "Create a trend article in the AFRIVOGUE editorial voice",
                parameters: {
                  type: "object",
                  properties: {
                    headline: { type: "string", description: "SEO-optimized headline, max 80 chars" },
                    cultural_significance: { type: "string", description: "150-300 word editorial prose with citations" },
                    category: { type: "string", enum: ["Fashion", "Beauty", "Luxury", "Art & Design", "Culture", "Business"] },
                    urgency: { type: "string", enum: ["Breaking", "Emerging", "Slow-Burn"] },
                    geo_relevance: { type: "string", enum: ["Africa", "Diaspora", "Global"] },
                    content_tier: { type: "string", enum: ["Daily Brief", "Editorial Feature", "Premium Long-Form"] },
                    image_hint: { type: "string", description: "2-3 word image search hint" },
                  },
                  required: ["headline", "cultural_significance", "category", "urgency", "geo_relevance", "content_tier", "image_hint"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "create_trend" } },
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("AI rewrite failed:", aiResponse.status, errText);
        if (aiResponse.status === 429) {
          console.log("Rate limited, stopping batch");
          break;
        }
        continue;
      }

      const aiData = await aiResponse.json();
      let trendData: any;

      try {
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          trendData = JSON.parse(toolCall.function.arguments);
        }
      } catch (e) {
        console.error("Failed to parse AI response:", e);
        continue;
      }

      if (!trendData?.headline || !trendData?.cultural_significance) {
        console.error("Invalid AI output, skipping");
        continue;
      }

      // Dedup check on headline
      if (existingHeadlines.has(trendData.headline.toLowerCase())) {
        console.log("Skipping duplicate headline:", trendData.headline);
        continue;
      }

      // Step 3: Save to database
      const { error: insertError } = await supabase.from("trends").insert({
        headline: trendData.headline,
        cultural_significance: trendData.cultural_significance,
        category: trendData.category || detectCategory(sourceContent),
        urgency: trendData.urgency || detectUrgency(sourceContent),
        geo_relevance: trendData.geo_relevance || detectGeo(sourceContent),
        content_tier: trendData.content_tier || "Daily Brief",
        image_hint: trendData.image_hint || "",
        source_url: result.url || "",
        source_name: result.title?.split(" - ").pop()?.trim() || new URL(result.url).hostname,
        featured_image_url: result.metadata?.ogImage || result.metadata?.image || null,
        published: true,
        needs_review: true,
        original_source_content: sourceContent.slice(0, 5000),
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        continue;
      }

      existingHeadlines.add(trendData.headline.toLowerCase());
      existingUrls.add(result.url);
      ingested++;
      console.log("Ingested:", trendData.headline);
    }

    console.log(`Pipeline complete. Ingested ${ingested} new trends.`);
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
