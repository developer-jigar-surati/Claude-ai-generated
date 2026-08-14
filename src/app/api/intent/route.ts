import { NextResponse } from "next/server";
import { detectIntent } from "@/lib/llm";
import { getAgent } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Server-side intent detection (real Claude when configured, else heuristic). */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const utterance = String(body.utterance || "");
  if (!utterance.trim()) {
    return NextResponse.json({ error: "utterance required" }, { status: 400 });
  }
  const agent = body.agentId ? getAgent(String(body.agentId)) : undefined;
  const rescheduleMinutes = agent?.rules.rescheduleMinutes ?? 30;
  const result = await detectIntent(utterance, rescheduleMinutes);
  return NextResponse.json({ result });
}
