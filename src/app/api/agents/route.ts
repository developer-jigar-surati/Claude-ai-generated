import { NextResponse } from "next/server";
import { addAgent, listAgentsWithMetrics } from "@/lib/store";
import { defaultRulesFor, getTemplate } from "@/lib/templates";
import { Agent, CampaignRules, Direction } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ agents: await listAgentsWithMetrics() });
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

  const id = `agt_${Math.random().toString(36).slice(2, 10)}`;

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
    createdAt: new Date().toISOString(),
  };

  await addAgent(agent);
  return NextResponse.json({ agent }, { status: 201 });
}
