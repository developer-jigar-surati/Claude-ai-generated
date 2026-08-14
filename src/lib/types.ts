// Core domain types for the Voice Agent OS platform.

export type Direction = "inbound" | "outbound";

export type AgentStatus = "active" | "paused" | "draft";

export interface AgentTemplate {
  id: string;
  name: string;
  direction: Direction;
  category: string;
  description: string;
  icon: string; // emoji used as a lightweight glyph
  /** Default first line the agent opens the call with. */
  greeting: string;
  /** Suggested goal the agent tries to accomplish on the call. */
  objective: string;
  /** Data points the agent tries to collect during the conversation. */
  collects: string[];
}

/**
 * Business rules that drive *when* and *how* a campaign dials.
 * This is the "Rule-Based Campaign Scheduling" capability from the pitch —
 * everything here is configurable from the UI with no code.
 */
export interface CampaignRules {
  businessHoursOnly: boolean;
  businessHoursStart: string; // "09:00"
  businessHoursEnd: string; // "18:00"
  respectCustomerTimezone: boolean;
  /** Send appointment reminders exactly N hours before the appointment. */
  reminderHoursBefore: number;
  /** Trigger feedback calls N hours after checkout / discharge. */
  feedbackHoursAfter: number;
  maxRetries: number;
  /** If a lead says "call me later", reschedule this many minutes out. */
  rescheduleMinutes: number;
}

export interface Integration {
  id: string;
  name: string;
  kind: "crm" | "erp" | "calendar" | "telephony" | "helpdesk";
  connected: boolean;
}

export interface Agent {
  id: string;
  name: string;
  direction: Direction;
  templateId: string;
  templateName: string;
  status: AgentStatus;
  voice: string;
  language: string;
  phoneNumber: string;
  greeting: string;
  objective: string;
  knowledgeBase: string;
  rules: CampaignRules;
  integrations: string[]; // integration ids
  callsToday: number;
  conversionRate: number; // 0-100
  avgCostPerCall: number;
  createdAt: string;
}

export interface PlatformStats {
  activeAgents: number;
  activeAgentsDeltaWeek: number;
  callsToday: number;
  callsDeltaPct: number;
  conversionRate: number;
  conversionDeltaPct: number;
  avgCostPerCall: number;
  costDeltaPct: number;
  liveCallsNow: number;
  agentsLive: number;
  conversionsToday: number;
}
