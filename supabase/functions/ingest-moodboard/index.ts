import { requireAdminOrCron, UnauthorizedError } from "../_shared/auth.ts";
import { generateJson } from "../_shared/claude.ts";
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
    "Black American street style fashion photography editorial",
    "Brooklyn Harlem street fashion contemporary editorial",
    "London Black British street style modern fashion",
    "Caribbean street style culture fashion photography",
  ],
  Culture: [
    "contemporary African cultural movement global 2025",
    "African music culture contemporary fashion editorial",
    "Black American celebrity red carpet fashion photography",
    "Hollywood Black excellence award show fashion",
    "Afrobeats global culture fashion contemporary visual art",
    "African diaspora culture global contemporary editorial",
    "Black celebrity style icon fashion editorial photography",
    "Caribbean carnival culture contemporary fashion editorial",
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const CURATOR_SYSTEM = `You are AfriVogue's visual curator: the person whose taste readers trust instantly, the way they trust a beautifully kept Pinterest board or a great magazine's photo desk.`;

const CURATION_BRIEF = `Select the 3 strongest images for this moodboard category and write a caption for each.

WHAT MAKES THE CUT
- Contemporary and editorial: strong composition, considered styling, real craft.
- African and diaspora creativity at its most confident, never stereotypical, tourist or poverty imagery.
- Range: West, East, South and North Africa and the global diaspora; vary subjects across the three.
- Rich colour, texture and light. Images you would pin, save and come back to.
- Reject thumbnails, logos, screenshots, text-heavy graphics, watermarked stock and anything blurry.

CAPTIONS
- 1 to 2 sentences in AfriVogue's voice: sensory, culturally aware, specific to what is in the frame.
- Name the designer, artist or place only if the context provides it. Never invent names.

Return image_url values exactly as given in the candidate list.`;

const CURATION_SCHEMA = {
  type: "object",
  properties: {
    selections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          image_url: { type: "string" },
          caption: { type: "string" },
        },
        required: ["image_url", "caption"],
        additionalProperties: false,
      },
    },
  },
  required: ["selections"],
  additionalProperties: false,
};

/** Keeps candidates whose URL actually serves an image, so the visual pass has fewer failures. */
async function filterLoadableImages<T extends { url: string }>(candidates: T[]): Promise<T[]> {
  const loadable = await Promise.all(
    candidates.map(async (c) => {
      try {
        const res = await fetch(c.url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(5000) });
        return res.ok && /^image\/(jpeg|png|webp|gif)/.test(res.headers.get("content-type") || "");
      } catch {
        return false;
      }
    }),
  );
  return candidates.filter((_, i) => loadable[i]).slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await requireAdminOrCron(req);

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!FIRECRAWL_API_KEY || !Deno.env.get("ANTHROPIC_API_KEY") || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
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

      // Claude looks at the candidates (when they load) and picks the strongest three.
      const shortlist = candidateImages.slice(0, 12);
      const viewable = await filterLoadableImages(shortlist);
      const curationText = `${CURATION_BRIEF}\n\nMoodboard category: "${category}".\n\nCandidates:\n${shortlist
        .map((c, i) => `${i + 1}. URL: ${c.url}\n   Context: ${c.context}\n   Source: ${c.sourceUrl}`)
        .join("\n\n")}`;

      let selections: { image_url: string; caption: string }[] = [];
      try {
        const visualPrompt = [
          ...viewable.flatMap((c) => [
            { type: "text" as const, text: `Candidate URL: ${c.url}` },
            { type: "image" as const, source: { type: "url" as const, url: c.url } },
          ]),
          { type: "text" as const, text: curationText },
        ];
        ({ selections } = await generateJson<{ selections: { image_url: string; caption: string }[] }>({
          system: CURATOR_SYSTEM,
          prompt: viewable.length > 0 ? visualPrompt : curationText,
          schema: CURATION_SCHEMA,
          effort: "medium",
        }));
      } catch (visualError) {
        // A blocked or broken image URL fails the whole visual request; judge from text instead.
        console.warn(`Visual curation failed for ${category}, retrying text-only:`, visualError instanceof Error ? visualError.message : visualError);
        try {
          ({ selections } = await generateJson<{ selections: { image_url: string; caption: string }[] }>({
            system: CURATOR_SYSTEM,
            prompt: curationText,
            schema: CURATION_SCHEMA,
            effort: "medium",
          }));
        } catch (textError) {
          console.error(`AI curation failed for ${category}:`, textError instanceof Error ? textError.message : textError);
          continue;
        }
      }

      // Only accept URLs we actually offered.
      const offered = new Set(shortlist.map((c) => c.url));
      selections = selections.filter((sel) => offered.has(sel.image_url));

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
    if (error instanceof UnauthorizedError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.error("Moodboard ingestion error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
