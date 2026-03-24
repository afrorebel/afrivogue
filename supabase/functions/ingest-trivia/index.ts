import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CATEGORIES = ["Fashion", "Culture", "Entertainment", "Lifestyle", "Beauty", "Art & Design", "Luxury", "Business"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
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

    const aiPrompt = `You are an expert quiz writer for AFRIVOGUE, a global fashion, culture, entertainment, and lifestyle platform with an Afro-global soul. Afrivogue celebrates the FULL spectrum of Black culture worldwide and is for everyone who appreciates culture, style, and innovation. Generate 8 unique, engaging trivia questions.

REQUIREMENTS:
- Mix of historical and contemporary topics from ACROSS THE BLACK WORLD and global culture
- Cover: African fashion, Black American celebrity culture, Hollywood, diaspora movements, Caribbean influence, Afrobeats, global entertainment, beauty, luxury, art, and lifestyle
- Include questions about: African designers, Black American icons (Beyoncé, Rihanna, Virgil Abloh, etc.), Hollywood moments, cultural traditions, fashion weeks, music artists, film, beauty innovations, textile arts, cultural movements, diaspora influence, global lifestyle trends
- Each question must have exactly 4 options with one correct answer
- Provide a brief but insightful explanation for the correct answer
- Add an optional fun fact that's surprising or memorable
- Difficulty should vary: 3 easy, 3 medium, 2 hard
- Category for each question: ${CATEGORIES.join(", ")}
- Make questions educational and entertaining — not obscure trivia nobody would know
- Reference real people, brands, events, movements from Africa, America, Europe, Caribbean, and beyond
- Ensure global appeal — questions should be interesting to anyone regardless of race or location

CURRENT TRENDING TOPICS (use some for inspiration):
${trendContext || "General fashion, culture, and entertainment trends"}

Return a JSON array using this tool call.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: aiPrompt }],
        tools: [
          {
            type: "function",
            function: {
              name: "create_trivia_batch",
              description: "Create a batch of trivia questions",
              parameters: {
                type: "object",
                required: ["questions"],
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["question", "options", "correct_answer", "explanation", "category", "difficulty"],
                      properties: {
                        question: { type: "string" },
                        options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                        correct_answer: { type: "string" },
                        explanation: { type: "string" },
                        category: { type: "string", enum: CATEGORIES },
                        difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                        fun_fact: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_trivia_batch" } },
        temperature: 0.9,
      }),
    });

    if (!aiRes.ok) {
      throw new Error(`AI request failed: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const { questions: newQuestions } = JSON.parse(toolCall.function.arguments);
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
    console.error("Trivia ingestion error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
