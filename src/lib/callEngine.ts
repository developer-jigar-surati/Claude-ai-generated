import { Agent, Call, CallOutcome } from "./types";
import { getTemplate } from "./templates";
import { config } from "./config";
import { detectIntent } from "./llm";
import { placeVapiCall, voiceEnabled } from "./voice";
import { insertCall, makeDay } from "./store";

/**
 * The call engine turns "dial this number with this agent" into a real,
 * recorded call. With a voice provider configured it places a live call;
 * otherwise it runs a faithful simulation (real DB row, real intent
 * detection) so the whole product is demoable with no external services.
 */

const SAMPLE_UTTERANCES = [
  "Yes, that works for me.",
  "I'm busy, call me after 30 minutes.",
  "Not interested, please stop calling.",
  "Can you call me back tomorrow?",
  "Sure, sounds good.",
  "Try again in 2 hours.",
];

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function outcomeFromIntent(intent: string): CallOutcome {
  switch (intent) {
    case "confirm":
      return "converted";
    case "reschedule":
    case "callback_unspecified":
      return "rescheduled";
    case "not_interested":
      return "not_interested";
    default:
      return "voicemail";
  }
}

function collectedFor(agent: Agent, outcome: CallOutcome): Record<string, string> {
  if (outcome !== "converted") return {};
  const t = getTemplate(agent.templateId);
  if (!t) return {};
  const filled: Record<string, string> = {};
  for (const field of t.collects) filled[field] = "captured";
  return filled;
}

export interface RunCallInput {
  agent: Agent;
  toNumber: string;
  /** For simulation/testing: the customer utterance to classify. */
  utterance?: string;
}

export async function runCall({ agent, toNumber, utterance }: RunCallInput): Promise<Call> {
  const startedAt = new Date().toISOString();

  // Live path: hand off to the voice provider.
  if (voiceEnabled()) {
    try {
      const placed = await placeVapiCall(agent, toNumber);
      const call: Call = {
        id: placed.externalId.startsWith("call") ? placed.externalId : newId("call"),
        agentId: agent.id,
        direction: agent.direction,
        toNumber,
        status: "in_progress",
        outcome: "in_progress",
        intent: "in_progress",
        collected: {},
        durationSec: 0,
        cost: 0,
        provider: "vapi",
        transcript: `Live call placed via Vapi (id: ${placed.externalId}).`,
        startedAt,
        day: makeDay(startedAt),
      };
      return insertCall(call);
    } catch (err) {
      // If the live provider fails, degrade to a simulated record rather than
      // dropping the call silently.
      const call: Call = {
        id: newId("call"),
        agentId: agent.id,
        direction: agent.direction,
        toNumber,
        status: "completed",
        outcome: "no_answer",
        intent: "unknown",
        collected: {},
        durationSec: 0,
        cost: 0,
        provider: "vapi-error",
        transcript: `Provider error: ${(err as Error).message}`,
        startedAt,
        day: makeDay(startedAt),
      };
      return insertCall(call);
    }
  }

  // Simulated path — still uses real intent detection.
  const said = utterance || SAMPLE_UTTERANCES[Math.floor(Math.random() * SAMPLE_UTTERANCES.length)];
  const intentResult = await detectIntent(said, agent.rules.rescheduleMinutes);
  const outcome = outcomeFromIntent(intentResult.intent);
  const duration = outcome === "no_answer" ? 0 : 45 + Math.floor(Math.random() * 200);
  const baseCost = agent.templateId === "recruiting-screener" ? 0.5 : 0.36;
  const cost =
    outcome === "no_answer"
      ? 0.03
      : Math.max(0.05, Math.round((baseCost + (Math.random() - 0.5) * 0.1) * 100) / 100);

  const greeting = agent.greeting.replace(/\{company\}/g, config.workspaceName);
  const transcript = [
    `Agent: ${greeting}`,
    `Customer: ${said}`,
    `Agent: [${intentResult.reason}]`,
  ].join("\n");

  const call: Call = {
    id: newId("call"),
    agentId: agent.id,
    direction: agent.direction,
    toNumber,
    status: "completed",
    outcome,
    intent: intentResult.intent,
    collected: collectedFor(agent, outcome),
    durationSec: duration,
    cost,
    provider: intentResult.source === "llm" ? "simulator+claude" : "simulator",
    transcript,
    startedAt,
    day: makeDay(startedAt),
  };
  return insertCall(call);
}
