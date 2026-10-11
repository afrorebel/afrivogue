import { requireAdminOrCron, UnauthorizedError } from "../_shared/auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateJson } from "../_shared/claude.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CATEGORIES = ["Fashion", "Culture", "Entertainment", "Lifestyle", "Beauty", "Art & Design", "Luxury", "Business"];

interface TriviaQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  category: string;
  difficulty: string;
  fun_fact: string;
}

const TRIVIA_SYSTEM = `You write AfriTrivia, AfriVogue's culture quiz: fun, smart questions about fashion, beauty, music, film, art and lifestyle across Africa and its diaspora, for anyone who loves culture.

RULES
- Only ask about well-documented facts you are certain of. If you are not sure, choose a different question. Accuracy matters more than novelty.
- Real people, brands, events and movements from Africa, the Americas, Europe and the Caribbean.
- Exactly 4 options per question. correct_answer must match one option exactly. Make the wrong options plausible.
- explanation: 1 to 2 sentences that teach something.
- fun_fact: one surprising, memorable detail.
- Difficulty mix per batch: 3 easy, 3 medium, 2 hard. Educational and entertaining, never obscure for its own sake.`;

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
          category: { type: "string", enum: CATEGORIES },
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await requireAdminOrCron(req);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get existing questions to avoid duplicates
    const { data: existing } = await supabase
      .from("trivia_questions")
      .select("question")
      .order("created_at", { ascending: false })
      .limit(200);
    const existingSet = new Set((existing || []).map((e: any) => e.question.toLowerCase().trim()));

    // Get recent trends for context
    const { data: trends } = await supabase
      .from("trends")
      .select("headline, category, cultural_significance")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(20);

    const trendContext = (trends || [])
      .map((t: any) => `- ${t.headline} (${t.category}): ${t.cultural_significance?.slice(0, 150)}`)
      .join("\n");

    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

    const { questions: newQuestions } = await generateJson<{ questions: TriviaQuestion[] }>({
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

    for (const q of newQuestions) {
      if (existingSet.has(q.question.toLowerCase().trim())) continue;
      if (!q.options || q.options.length !== 4) continue;
      if (!q.options.includes(q.correct_answer)) continue;

      const { error } = await supabase.from("trivia_questions").insert({
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

    return new Response(JSON.stringify({ success: true, ingested }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.error("Trivia ingestion error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
