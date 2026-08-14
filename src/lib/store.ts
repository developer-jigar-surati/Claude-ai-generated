import { Agent, PlatformStats } from "./types";
import { defaultRulesFor, getTemplate } from "./templates";
import { INTEGRATIONS } from "./integrations";

export { INTEGRATIONS };

/**
 * In-memory data store. In a real deployment this is your database +
 * voice-orchestration layer (Vapi / Bolna / Twilio + LLM + TTS/STT).
 * For this MVP it keeps the whole product functional end-to-end with
 * zero external services so you can demo the flow instantly.
 *
 * NOTE: module-level state resets on server restart / redeploy — that's
 * fine for a demo. Swap `agents` for a DB call to persist.
 */

function seed(): Agent[] {
  return [
    {
      id: "agt_appt_reminders",
      name: "Appointment Reminders",
      direction: "outbound",
      templateId: "appointment-reminder",
      templateName: "Appointment Reminder",
      status: "active",
      voice: "Aria (Female, US)",
      language: "English (US)",
      phoneNumber: "+1 (415) 555-0142",
      greeting: getTemplate("appointment-reminder")!.greeting,
      objective: getTemplate("appointment-reminder")!.objective,
      knowledgeBase: "Clinic hours, provider list, rescheduling policy",
      rules: defaultRulesFor("appointment-reminder"),
      integrations: ["gcal", "twilio"],
      callsToday: 1116,
      conversionRate: 24.6,
      avgCostPerCall: 0.36,
      createdAt: "2026-08-01T09:00:00.000Z",
    },
    {
      id: "agt_recruit_screen",
      name: "Recruitment Pre-Screening",
      direction: "outbound",
      templateId: "recruiting-screener",
      templateName: "Recruiting Screener",
      status: "active",
      voice: "Leo (Male, US)",
      language: "English (US)",
      phoneNumber: "+1 (415) 555-0198",
      greeting: getTemplate("recruiting-screener")!.greeting,
      objective: getTemplate("recruiting-screener")!.objective,
      knowledgeBase: "Role JD, screening rubric, salary bands",
      rules: defaultRulesFor("recruiting-screener"),
      integrations: ["salesforce", "twilio"],
      callsToday: 168,
      conversionRate: 24.6,
      avgCostPerCall: 0.50,
      createdAt: "2026-08-05T09:00:00.000Z",
    },
  ];
}

// eslint-disable-next-line no-var
declare global {
  var __VOICE_AGENT_STORE__: Agent[] | undefined;
}

// Persist across HMR reloads in dev.
export const agents: Agent[] = globalThis.__VOICE_AGENT_STORE__ ?? seed();
globalThis.__VOICE_AGENT_STORE__ = agents;

export function listAgents(): Agent[] {
  return agents;
}

export function getAgent(id: string): Agent | undefined {
  return agents.find((a) => a.id === id);
}

export function addAgent(agent: Agent): Agent {
  agents.unshift(agent);
  return agent;
}

export function computeStats(): PlatformStats {
  const active = agents.filter((a) => a.status === "active");
  const callsToday = agents.reduce((s, a) => s + a.callsToday, 0);
  const weightedConv =
    callsToday > 0
      ? agents.reduce((s, a) => s + a.conversionRate * a.callsToday, 0) / callsToday
      : 0;
  const avgCost =
    callsToday > 0
      ? agents.reduce((s, a) => s + a.avgCostPerCall * a.callsToday, 0) / callsToday
      : 0;

  return {
    activeAgents: active.length,
    activeAgentsDeltaWeek: 2,
    callsToday,
    callsDeltaPct: 11.4,
    conversionRate: Math.round(weightedConv * 10) / 10,
    conversionDeltaPct: 3.1,
    avgCostPerCall: Math.round(avgCost * 100) / 100,
    costDeltaPct: -4.2,
    liveCallsNow: 18,
    agentsLive: active.length,
    conversionsToday: 34,
  };
}
