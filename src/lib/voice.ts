import { config, features } from "./config";
import { Agent } from "./types";

/**
 * Voice provider adapter. When VAPI_API_KEY is configured, this places a real
 * phone call through Vapi (which orchestrates telephony + speech + the LLM).
 * Without it, callers fall back to the simulator in callEngine.ts.
 */

export interface PlacedCall {
  provider: "vapi";
  externalId: string;
  status: "queued";
}

export function voiceEnabled(): boolean {
  return features().voice;
}

export async function placeVapiCall(
  agent: Agent,
  toNumber: string
): Promise<PlacedCall> {
  const res = await fetch(`${config.vapiBaseUrl}/call`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.vapiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phoneNumberId: config.vapiPhoneNumberId || undefined,
      customer: { number: toNumber.replace(/[^\d+]/g, "") },
      assistant: {
        firstMessage: agent.greeting.replace(/\{company\}/g, config.workspaceName),
        model: {
          provider: "anthropic",
          model: config.anthropicModel,
          messages: [
            {
              role: "system",
              content: `You are ${agent.name}, a ${agent.direction} voice agent for ${config.workspaceName}. Objective: ${agent.objective}. Knowledge: ${agent.knowledgeBase}`,
            },
          ],
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Vapi call failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = (await res.json().catch(() => ({}))) as { id?: string };
  return { provider: "vapi", externalId: data.id || "unknown", status: "queued" };
}
