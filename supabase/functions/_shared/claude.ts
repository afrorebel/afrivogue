// Shared Claude client for AfriVogue's content pipeline (stories, editorials,
// forecasts, moodboard curation, trivia). Requires the ANTHROPIC_API_KEY secret.
import Anthropic from "npm:@anthropic-ai/sdk@0.131.0";

export const CLAUDE_MODEL = "claude-opus-5-5";

let client: Anthropic | null = null;

export function claude(): Anthropic {
  if (!client) {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
    client = new Anthropic({ apiKey });
  }
  return client;
}

/** Thrown when Claude (and its server-side fallback) declines a request. */
export class ClaudeRefusalError extends Error {}

/** Thrown when the response was cut off before the JSON finished. */
export class ClaudeTruncatedError extends Error {}

interface GenerateJsonOptions {
  /** Stable instructions; cached so repeated pipeline calls are cheaper. */
  system: string;
  /** The per-item task: source material plus what to produce (text, or text + image blocks). */
  prompt: string | Anthropic.Beta.BetaContentBlockParam[];
  /** JSON Schema the response must match (objects need additionalProperties: false). */
  schema: Record<string, unknown>;
  /** Thinking depth. "medium" for routine rewrites, "high" for long-form editorials. */
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
  maxTokens?: number;
}

/**
 * Asks Claude for a JSON object matching `schema` and returns it parsed.
 * Streams so long editorials never hit an HTTP timeout, and opts into
 * server-side refusal fallbacks so a declined request is retried on the
 * recommended fallback model instead of failing the pipeline.
 */
export async function generateJson<T>({
  system,
  prompt,
  schema,
  effort = "medium",
  maxTokens = 32000,
}: GenerateJsonOptions): Promise<T> {
  const stream = claude().beta.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort, format: { type: "json_schema", schema } },
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: prompt }],
  });

  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") {
    throw new ClaudeRefusalError(
      `Claude declined this item${message.stop_details?.category ? ` (${message.stop_details.category})` : ""}`,
    );
  }
  if (message.stop_reason === "max_tokens") {
    throw new ClaudeTruncatedError(`Response hit max_tokens (${maxTokens}) before the JSON finished`);
  }

  const text = message.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return JSON.parse(text) as T;
}

/** Runs async jobs with bounded concurrency; returns settled results in input order. */
export async function mapLimited<I, O>(
  items: I[],
  limit: number,
  fn: (item: I) => Promise<O>,
): Promise<PromiseSettledResult<O>[]> {
  const results: PromiseSettledResult<O>[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      try {
        results[index] = { status: "fulfilled", value: await fn(items[index]) };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
