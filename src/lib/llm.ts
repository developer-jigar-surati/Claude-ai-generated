import Anthropic from "@anthropic-ai/sdk";
import { config, features } from "./config";
import { detectIntent as heuristicIntent, RescheduleIntent } from "./intent";
import { Agent } from "./types";

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

export type Role = "agent" | "customer";
export interface Turn {
  role: Role;
  text: string;
}

function ruleReply(agent: Agent, intent: string): string {
  switch (intent) {
    case "confirm":
      return "Perfect, you're all set. Thank you for your time — have a great day!";
    case "reschedule":
      return "No problem at all, I'll call you back then. Talk to you soon!";
    case "callback_unspecified":
      return "Sure, I'll reach out again a little later. Have a great day!";
    case "not_interested":
      return "Understood — I won't call again. Thanks, and take care!";
    default:
      return `Thanks for that. To help with ${agent.objective.toLowerCase()}, could you tell me a little more?`;
  }
}

/**
 * Generate the agent's spoken reply. Uses Claude when ANTHROPIC_API_KEY is set
 * (natural conversation), otherwise a friendly rule-based reply. Either way the
 * browser speaks it aloud.
 */
export async function converse(
  agent: Agent,
  history: Turn[],
  userMessage: string
): Promise<{ reply: string; intent: string; source: "llm" | "rules" }> {
  const intentRes = await detectIntent(userMessage, agent.rules.rescheduleMinutes);
  const c = getClient();

  if (c) {
    try {
      const company = config.workspaceName;
      const system = `You are ${agent.name}, a warm, concise ${agent.direction} AI voice agent for ${company}.
Your objective on this call: ${agent.objective}
Knowledge you can rely on: ${agent.knowledgeBase || "(none provided)"}
Rules:
- Speak naturally, like a real phone agent. Keep replies to 1–2 short sentences.
- If the customer wants to reschedule, gives a time, or is not interested, acknowledge politely and wrap up warmly.
- Never mention that you are an AI model.`;
      const messages = [
        ...history.map((t) => ({
          role: (t.role === "agent" ? "assistant" : "user") as "assistant" | "user",
          content: t.text,
        })),
        { role: "user" as const, content: userMessage },
      ];
      const resp = await c.messages.create({
        model: config.anthropicModel,
        max_tokens: 200,
        system,
        messages,
      });
      const block = resp.content.find((b) => b.type === "text");
      const reply = block && "text" in block ? block.text.trim() : "";
      if (reply) return { reply, intent: intentRes.intent, source: "llm" };
    } catch {
      // fall through to rules
    }
  }

  return { reply: ruleReply(agent, intentRes.intent), intent: intentRes.intent, source: "rules" };
}
