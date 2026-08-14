import { NextResponse } from "next/server";
import { addAgent, listAgents } from "@/lib/store";
import { defaultRulesFor, getTemplate } from "@/lib/templates";
import { Agent, CampaignRules, Direction } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ agents: listAgents() });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const templateId: string = body.templateId ?? "";
  const template = getTemplate(templateId);
  if (!template) {
    return NextResponse.json({ error: "Unknown template" }, { status: 400 });
  }

  const direction: Direction = body.direction === "inbound" ? "inbound" : "outbound";
  const rules: CampaignRules = { ...defaultRulesFor(templateId), ...(body.rules ?? {}) };

  const id = `agt_${Math.abs(hashString(String(body.name) + templateId + listAgents().length))
    .toString(36)
    .slice(0, 8)}`;

  const agent: Agent = {
    id,
    name: String(body.name || template.name).slice(0, 80),
    direction,
    templateId,
    templateName: template.name,
    status: "active",
    voice: String(body.voice || "Aria (Female, US)"),
    language: String(body.language || "English (US)"),
    phoneNumber: String(body.phoneNumber || "+1 (415) 555-0100"),
    greeting: String(body.greeting || template.greeting),
    objective: String(body.objective || template.objective),
    knowledgeBase: String(body.knowledgeBase || ""),
    rules,
    integrations: Array.isArray(body.integrations) ? body.integrations : [],
    callsToday: 0,
    conversionRate: 0,
    avgCostPerCall: 0,
    createdAt: new Date().toISOString(),
  };

  addAgent(agent);
  return NextResponse.json({ agent }, { status: 201 });
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}
