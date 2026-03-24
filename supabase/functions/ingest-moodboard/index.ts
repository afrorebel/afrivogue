const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MOODBOARD_CATEGORIES = [
  "Fashion",
  "Beauty",
  "Art",
  "Design",
  "Street Style",
  "Culture",
] as const;

const SEARCH_QUERIES: Record<string, string[]> = {
  Fashion: [
    "contemporary African fashion editorial 2025 2026",
    "African diaspora designer runway collection global",
    "Afrofuturism couture fashion photography editorial",
    "African luxury streetwear contemporary styling",
    "modern African textile fashion global runway",
    "West African fashion week contemporary editorial",
    "East African designer modern minimalist collection",
    "African fashion global influence editorial photography",
  ],
  Beauty: [
    "contemporary African beauty editorial global 2025",
    "melanin beauty luxury campaign photography",
    "African-inspired beauty trends global editorial",
    "natural hair art editorial contemporary African",
    "African beauty innovation skincare global trends",
    "Afrocentric makeup artistry editorial modern",
    "African diaspora beauty culture global photography",
  ],
  Art: [
    "contemporary African art global exhibition 2025",
    "African diaspora modern art installation gallery",
    "Afrofuturism digital art contemporary illustration",
    "African contemporary sculpture mixed media global",
    "Pan-African modern art movement photography",
    "African artists global biennale contemporary work",
    "African-inspired visual art modern gallery editorial",
  ],
  Design: [
    "contemporary African interior design global luxury",
    "African-inspired architecture modern minimalist global",
    "African textile pattern contemporary design innovation",
    "modern African graphic design branding global",
    "African artisan jewelry contemporary luxury design",
    "African-inspired product design modern global",
    "contemporary African furniture design editorial",
  ],
  "Street Style": [
    "Lagos street style contemporary fashion 2025",
    "Accra street fashion modern editorial photography",
    "Johannesburg contemporary street style global",
    "Nairobi street fashion editorial modern African",
    "African streetwear global influence contemporary",
    "Dakar street style modern fashion photography",
    "African urban fashion contemporary global editorial",
  ],
  Culture: [
    "contemporary African cultural movement global 2025",
    "African music culture contemporary fashion editorial",
    "modern African dance performance visual art global",
    "African heritage contemporary reinterpretation editorial",
    "Pan-African cultural renaissance modern photography",
    "African diaspora culture global contemporary editorial",
    "Afrobeats culture fashion contemporary visual art",
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!FIRECRAWL_API_KEY || !LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Pick 2 random categories to process per run
    const categoriesToProcess = [...MOODBOARD_CATEGORIES]
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    // Get existing image URLs for deduplication
    const { data: existingItems } = await supabase
      .from("moodboard_items")
      .select("image_url")
      .order("created_at", { ascending: false })
      .limit(500);

    const existingUrls = new Set((existingItems || []).map((i: any) => i.image_url));

    let totalIngested = 0;

    for (const category of categoriesToProcess) {
      const query = pickRandom(SEARCH_QUERIES[category]);
      console.log(`Searching for ${category}: "${query}"`);

      // Search with Firecrawl
      const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          limit: 10,
          tbs: "qdr:w", // last week
          scrapeOptions: { formats: ["markdown", "links"] },
        }),
      });

      if (!searchRes.ok) {
        console.error(`Firecrawl search failed for ${category}: ${searchRes.status}`);
        continue;
      }

      const searchData = await searchRes.json();
      const results = searchData.data || [];

      // Extract image URLs from results
      const candidateImages: { url: string; context: string; sourceUrl: string }[] = [];

      for (const result of results) {
        const markdown = result.markdown || "";
        const sourceUrl = result.url || "";

        // Extract image URLs from markdown
        const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        let match;
        while ((match = imgRegex.exec(markdown)) !== null) {
          const imgUrl = match[2];
          if (
            imgUrl &&
            (imgUrl.endsWith(".jpg") ||
              imgUrl.endsWith(".jpeg") ||
              imgUrl.endsWith(".png") ||
              imgUrl.endsWith(".webp") ||
              imgUrl.includes("unsplash") ||
              imgUrl.includes("images")) &&
            !imgUrl.includes("icon") &&
            !imgUrl.includes("logo") &&
            !imgUrl.includes("avatar") &&
            !imgUrl.includes("favicon") &&
            imgUrl.length < 500 &&
            !existingUrls.has(imgUrl)
          ) {
            candidateImages.push({
              url: imgUrl,
              context: match[1] || result.title || "",
              sourceUrl,
            });
          }
        }

        // Also extract from og:image or featured images in metadata
        if (result.metadata?.ogImage && !existingUrls.has(result.metadata.ogImage)) {
          candidateImages.push({
            url: result.metadata.ogImage,
            context: result.title || "",
            sourceUrl,
          });
        }
      }

      if (candidateImages.length === 0) {
        console.log(`No candidate images found for ${category}`);
        continue;
      }

      // Use AI to curate the best images
      const aiPrompt = `You are Afrivogue's visual curator. Afrivogue is a luxury African fashion and culture editorial platform.

Given these candidate images for the "${category}" moodboard category, select the TOP 3 most visually compelling and editorially relevant ones. 

Criteria:
- High visual impact and editorial quality
- Aligns with luxury African fashion/culture aesthetics
- Diverse representation across African diaspora
- Trendsetting, not generic stock imagery
- Avoids low-resolution thumbnails or irrelevant images

Candidates:
${candidateImages
  .slice(0, 15)
  .map((c, i) => `${i + 1}. URL: ${c.url}\n   Context: ${c.context}\n   Source: ${c.sourceUrl}`)
  .join("\n\n")}

For each selected image, provide an editorial caption that matches Afrivogue's voice — sophisticated, culturally aware, and trend-forward.`;

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: aiPrompt }],
          tools: [
            {
              type: "function",
              function: {
                name: "curate_moodboard_images",
                description: "Submit curated moodboard images",
                parameters: {
                  type: "object",
                  required: ["selections"],
                  properties: {
                    selections: {
                      type: "array",
                      items: {
                        type: "object",
                        required: ["image_url", "caption"],
                        properties: {
                          image_url: { type: "string", description: "The selected image URL" },
                          caption: { type: "string", description: "Editorial caption for the image" },
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "curate_moodboard_images" } },
        }),
      });

      if (!aiRes.ok) {
        console.error(`AI curation failed for ${category}: ${aiRes.status}`);
        continue;
      }

      const aiData = await aiRes.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        console.log(`No AI tool call for ${category}`);
        continue;
      }

      let selections: { image_url: string; caption: string }[];
      try {
        selections = JSON.parse(toolCall.function.arguments).selections;
      } catch {
        console.error(`Failed to parse AI response for ${category}`);
        continue;
      }

      // Insert curated images
      for (const sel of selections) {
        if (!sel.image_url || existingUrls.has(sel.image_url)) continue;

        const { error } = await supabase.from("moodboard_items").insert({
          image_url: sel.image_url,
          caption: sel.caption || "",
          category,
          approved: true,
          needs_review: true,
        });

        if (error) {
          console.error(`Insert error: ${error.message}`);
        } else {
          existingUrls.add(sel.image_url);
          totalIngested++;
        }
      }
    }

    console.log(`Moodboard ingestion complete: ${totalIngested} images added`);

    return new Response(
      JSON.stringify({
        success: true,
        ingested: totalIngested,
        categories: categoriesToProcess,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Moodboard ingestion error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
