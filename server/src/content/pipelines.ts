// AfriVogue's Claude content engine: finds fresh sources with Firecrawl, then has Claude
// write stories, long-form editorials, forecasts, moodboard captions and trivia in our voice.
// Every job here spends Anthropic/Firecrawl credit, so routes call them only for admins or cron.
/* eslint-disable @typescript-eslint/no-explicit-any */
import type Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";
import { db } from "../data/adminDb";
import { CLAUDE_MODEL, generateJson, mapLimited } from "./claude";
import { renderEditorialHtml } from "./editorialHtml";
import { AFRIVOGUE_VOICE, CATEGORIES, GEOS, URGENCIES } from "./voice";

function requireKeys(firecrawl = true) {
  if (!config.anthropicApiKey) throw new Error("ANTHROPIC_API_KEY is not set. Add it in hPanel → Node.js → Environment variables.");
  if (firecrawl && !config.firecrawlApiKey) throw new Error("FIRECRAWL_API_KEY is not set. Add it in hPanel → Node.js → Environment variables.");
}

async function firecrawlSearch(body: Record<string, unknown>, timeoutMs = 60000): Promise<any[]> {
  const res = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.firecrawlApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Firecrawl search error:", data);
    throw new Error(`Firecrawl search failed: ${res.status}`);
  }
  return data.data || [];
}

const pickRandom = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

/* ───────────── stories (ingest-trends) ───────────── */

const TREND_QUERIES = [
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

interface TrendStoryOutput {
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

const TREND_STORY_SCHEMA = {
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


export async function ingestTrends() {
  requireKeys();
  const query = pickRandom(TREND_QUERIES);
  console.log("Searching for:", query);
  const results = await firecrawlSearch({ query, limit: 5, tbs: "qdr:d", scrapeOptions: { formats: ["markdown"] } });
  if (results.length === 0) return { success: true, ingested: 0, query, message: "No new content found" };

  const { data: existing } = await db.from("trends").select("headline, source_url").order("created_at", { ascending: false }).limit(100);
  const existingHeadlines = new Set((existing || []).map((t: any) => t.headline?.toLowerCase()));
  const existingUrls = new Set((existing || []).map((t: any) => t.source_url).filter(Boolean));

  // Keep only fresh, substantial results before spending tokens on them.
  const candidates = results.filter((result: any) => {
    if (result.url && existingUrls.has(result.url)) return false;
    return (result.markdown || result.description || "").length >= 100;
  });

  const rewrites = await mapLimited(candidates, 3, async (result: any) => {
    const sourceContent: string = result.markdown || result.description || "";
    const story = await generateJson<TrendStoryOutput>({
      system: `${AFRIVOGUE_VOICE}\n\n${STORY_BRIEF}`,
      prompt: `Write an AfriVogue story from this source.\n\nSource title: ${result.title}\nSource URL: ${result.url}\n\n<source_material>\n${sourceContent.slice(0, 12000)}\n</source_material>`,
      schema: TREND_STORY_SCHEMA,
      effort: "medium",
    });
    return { result, sourceContent, story };
  });

  let ingested = 0;
  for (const outcome of rewrites) {
    if (outcome.status === "rejected") {
      console.error("Rewrite failed:", outcome.reason instanceof Error ? outcome.reason.message : outcome.reason);
      continue;
    }
    const { result, sourceContent, story } = outcome.value;
    if (!story.headline || !story.cultural_significance) continue;
    if (existingHeadlines.has(story.headline.toLowerCase())) continue;

    const tier = story.content_tier || "Daily Brief";
    const isEditorial = tier === "Editorial Feature" || tier === "Premium Long-Form";
    let sourceName = result.title?.split(" - ").pop()?.trim();
    if (!sourceName) {
      try {
        sourceName = new URL(result.url).hostname;
      } catch {
        sourceName = "";
      }
    }
    const { error } = await db.from("trends").insert({
      headline: story.headline,
      cultural_significance: story.cultural_significance,
      category: story.category || detectCategory(sourceContent),
      urgency: story.urgency || detectUrgency(sourceContent),
      geo_relevance: story.geo_relevance || detectGeo(sourceContent),
      content_tier: tier,
      image_hint: story.image_hint || "",
      source_url: result.url || "",
      source_name: sourceName,
      featured_image_url: result.metadata?.ogImage || result.metadata?.image || null,
      // Features are held for review and enriched into long-form by enrichContent.
      published: !isEditorial,
      needs_review: true,
      original_source_content: sourceContent.slice(0, 12000),
    });
    if (error) {
      console.error("Insert error:", error);
      continue;
    }
    existingHeadlines.add(story.headline.toLowerCase());
    existingUrls.add(result.url);
    ingested++;
  }
  return { success: true, ingested, query };
}

/* ───────────── forecasts ───────────── */

const FORECAST_QUERIES = [
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


export async function ingestForecasts() {
  requireKeys();
  const query = pickRandom(FORECAST_QUERIES);
  const results = await firecrawlSearch({ query, limit: 5, tbs: "qdr:w", scrapeOptions: { formats: ["markdown"] } });
  if (results.length === 0) return { success: true, ingested: 0, query, message: "No new content found" };

  const { data: existing } = await db.from("forecasts").select("title").order("created_at", { ascending: false }).limit(100);
  const existingTitles = new Set((existing || []).map((f: any) => f.title?.toLowerCase()));
  const candidates = results.filter((r: any) => (r.markdown || r.description || "").length >= 100);

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

  let ingested = 0;
  for (const outcome of forecasts) {
    if (outcome.status === "rejected") {
      console.error("Forecast failed:", outcome.reason instanceof Error ? outcome.reason.message : outcome.reason);
      continue;
    }
    const { sourceContent, forecast } = outcome.value;
    if (!forecast.title || !forecast.projection || existingTitles.has(forecast.title.toLowerCase())) continue;
    const { error } = await db.from("forecasts").insert({
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
    if (error) {
      console.error("Insert error:", error);
      continue;
    }
    existingTitles.add(forecast.title.toLowerCase());
    ingested++;
  }
  return { success: true, ingested, query };
}

/* ───────────── moodboard ───────────── */

const MOODBOARD_CATEGORIES = [
  "Fashion",
  "Beauty",
  "Art",
  "Design",
  "Street Style",
  "Culture",
] as const;

const MOODBOARD_QUERIES: Record<string, string[]> = {
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


export async function ingestMoodboard() {
  requireKeys();
  // Pick 2 random categories to process per run
  const categoriesToProcess = [...MOODBOARD_CATEGORIES]
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  // Get existing image URLs for deduplication
  const { data: existingItems } = await db
    .from("moodboard_items")
    .select("image_url")
    .order("created_at", { ascending: false })
    .limit(500);

  const existingUrls = new Set((existingItems || []).map((i: any) => i.image_url));

  let totalIngested = 0;

  for (const category of categoriesToProcess) {
    const query = pickRandom(MOODBOARD_QUERIES[category]);
    console.log(`Searching for ${category}: "${query}"`);

    let results: any[];
    try {
      results = await firecrawlSearch({ query, limit: 10, tbs: "qdr:w", scrapeOptions: { formats: ["markdown", "links"] } });
    } catch (err) {
      console.error(`Firecrawl search failed for ${category}:`, err instanceof Error ? err.message : err);
      continue;
    }

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

      const { error } = await db.from("moodboard_items").insert({
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

  return { success: true, ingested: totalIngested, categories: categoriesToProcess };
}

/* ───────────── trivia ───────────── */

const TRIVIA_CATEGORIES = ["Fashion", "Culture", "Entertainment", "Lifestyle", "Beauty", "Art & Design", "Luxury", "Business"];

interface TriviaQuestionOutput {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  category: string;
  difficulty: string;
  fun_fact: string;
}

const TRIVIA_SYSTEM = `You write AfriTrivia, AfriVogue's daily culture game. It should feel like a fun quiz with friends, not an exam: anyone who loves music, film, style, beauty and food from Africa and the diaspora should be able to play, win some and lose some, and walk away knowing something new.

RULES
- Only ask about well-documented facts you are certain of. If you are not sure, choose a different question. Accuracy matters more than novelty.
- Keep questions short (under 120 characters) and conversational. No trick wording, no double negatives.
- Prefer things people have seen, heard, worn or eaten: famous songs and films, iconic looks, fabrics and where they come from, beauty rituals, celebrated designers and artists, big cultural moments. Avoid dates and obscure archive trivia unless the answer is widely known.
- Exactly 4 options per question, each under 40 characters. correct_answer must match one option exactly. Wrong options should be plausible but clearly wrong once you know.
- explanation: 1 to 2 friendly sentences that teach the why behind the answer, so a wrong guess still feels worth it.
- fun_fact: one surprising, memorable detail people would repeat to a friend.
- Difficulty mix per batch: 3 easy (most people get it), 3 medium (fans get it), 2 hard (a good guess can still win it).
- Real people, brands, places and movements from Africa, the Americas, Europe and the Caribbean.`;

const TRIVIA_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correct_answer: { type: "string" },
          explanation: { type: "string" },
          category: { type: "string", enum: TRIVIA_CATEGORIES },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          fun_fact: { type: "string" },
        },
        required: ["question", "options", "correct_answer", "explanation", "category", "difficulty", "fun_fact"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
};


export async function ingestTrivia() {
  requireKeys(false);
  const { data: existing } = await db.from("trivia_questions").select("question").order("created_at", { ascending: false }).limit(200);
  const existingSet = new Set((existing || []).map((e: any) => String(e.question).toLowerCase().trim()));

  const { data: trends } = await db
    .from("trends")
    .select("headline, category, cultural_significance")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(20);
  const trendContext = (trends || []).map((t: any) => `- ${t.headline} (${t.category}): ${String(t.cultural_significance || "").slice(0, 150)}`).join("\n");
  const category = pickRandom(TRIVIA_CATEGORIES);

  const { questions } = await generateJson<{ questions: TriviaQuestionOutput[] }>({
    system: TRIVIA_SYSTEM,
    prompt: `Write 8 new AfriTrivia questions. Lean toward this category for at least half of them: ${category}.

Use these recent AfriVogue stories for inspiration where they fit (do not quiz on details only these summaries mention):
${trendContext || "General fashion, culture and entertainment"}

Avoid repeating any of these existing questions:
${[...existingSet].slice(0, 60).map((q) => `- ${q}`).join("\n")}`,
    schema: TRIVIA_SCHEMA,
    effort: "medium",
  });

  let ingested = 0;
  for (const q of questions) {
    if (existingSet.has(q.question.toLowerCase().trim())) continue;
    if (!q.options || q.options.length !== 4 || !q.options.includes(q.correct_answer)) continue;
    const { error } = await db.from("trivia_questions").insert({
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      category: q.category,
      difficulty: q.difficulty || "medium",
      fun_fact: q.fun_fact || null,
      published: true,
      needs_review: true,
    });
    if (!error) ingested++;
  }
  return { success: true, ingested };
}

/* ───────────── enrich: long-form editorials and re-voiced stories ───────────── */

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
  if (!config.firecrawlApiKey) return [];
  try {
    const results = await firecrawlSearch({ query: headline, limit: 3, scrapeOptions: { formats: ["markdown"] } }, 30000);
    return results
      .filter((r: any) => (r.markdown || "").length > 300)
      .map((r: any) => ({ title: r.title || r.url, url: r.url, markdown: (r.markdown as string).slice(0, 6000) }));
  } catch {
    return [];
  }
}


export async function enrichContent(body: { mode?: string; ids?: unknown; limit?: unknown } = {}) {
  requireKeys(false);
  const mode: "editorial" | "story" = body.mode === "story" ? "story" : "editorial";
  const ids: string[] | undefined = Array.isArray(body.ids) ? body.ids.slice(0, 5) : undefined;
  const limit = Math.min(Math.max(Number(body.limit) || (mode === "editorial" ? 1 : 4), 1), mode === "editorial" ? 3 : 8);

  let query = db
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
  if (!rows?.length) return { success: true, mode, processed: 0, message: "Nothing left to enrich" };

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
      const { error: updateError } = await db
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
    const { error: updateError } = await db
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

  return { success: true, mode, processed: done.length, done, failed };
}
