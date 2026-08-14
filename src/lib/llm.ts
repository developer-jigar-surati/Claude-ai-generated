import Anthropic from "@anthropic-ai/sdk";
import { config, features } from "./config";
import { detectIntent as heuristicIntent, RescheduleIntent } from "./intent";

/**
 * LLM layer. When ANTHROPIC_API_KEY is set, real intent detection runs on
 * Claude; otherwise we fall back to the built-in heuristic parser so the
 * product still works end-to-end with zero configuration.
 */

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!config.anthropicApiKey) return null;
  if (!client) client = new Anthropic({ apiKey: config.anthropicApiKey });
  return client;
}

const SYSTEM = `You classify what a customer said during an outbound phone call.
Return ONLY a compact JSON object, no prose, with this exact shape:
{"intent":"reschedule|confirm|not_interested|callback_unspecified|unknown","delayMinutes":<number or null>,"reason":"<short explanation>"}
- "reschedule": they gave a specific time to call back (fill delayMinutes with minutes from now).
- "confirm": they agreed / confirmed.
- "not_interested": they want to stop / opt out.
- "callback_unspecified": they want a callback but gave no time (delayMinutes null).
- "unknown": cannot tell.`;

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function detectIntent(
  utterance: string,
  rescheduleMinutes: number
): Promise<RescheduleIntent & { source: "llm" | "heuristic" }> {
  const c = getClient();
  if (!c) {
    const r = heuristicIntent(utterance);
    if (r.intent === "callback_unspecified") r.delayMinutes = rescheduleMinutes;
    return { ...r, source: "heuristic" };
  }

  try {
    const resp = await c.messages.create({
      model: config.anthropicModel,
      max_tokens: 300,
      system: SYSTEM,
      messages: [{ role: "user", content: `Customer said: "${utterance}"` }],
    });
    const textBlock = resp.content.find((b) => b.type === "text");
    const parsed = textBlock && "text" in textBlock ? extractJson(textBlock.text) : null;
    if (parsed && typeof parsed === "object") {
      const p = parsed as Record<string, unknown>;
      const intent = String(p.intent || "unknown") as RescheduleIntent["intent"];
      let delayMinutes =
        typeof p.delayMinutes === "number" ? p.delayMinutes : undefined;
      if (intent === "callback_unspecified" && delayMinutes == null) {
        delayMinutes = rescheduleMinutes;
      }
      return {
        intent,
        delayMinutes,
        reason: String(p.reason || "Classified by Claude."),
        source: "llm",
      };
    }
  } catch {
    // fall through to heuristic on any API error
  }

  const r = heuristicIntent(utterance);
  if (r.intent === "callback_unspecified") r.delayMinutes = rescheduleMinutes;
  return { ...r, source: "heuristic" };
}

export function llmEnabled(): boolean {
  return features().llm;
}
