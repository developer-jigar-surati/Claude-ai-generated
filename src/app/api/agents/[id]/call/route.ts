import { NextResponse } from "next/server";
import { getAgent } from "@/lib/store";
import { runCall } from "@/lib/callEngine";

export const dynamic = "force-dynamic";
// A 10-call campaign with live Claude can take a while — give it headroom.
export const maxDuration = 60;

/**
 * Place (or simulate) one or more calls with this agent.
 * Body: { toNumber?, utterance?, count? }
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = await getAgent(id);
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const toNumber = String(body.toNumber || "+1 (415) 555-0123");
  const utterance = typeof body.utterance === "string" ? body.utterance : undefined;
  const count = Math.min(Math.max(parseInt(String(body.count ?? 1), 10) || 1, 1), 25);

  const calls = [];
  for (let i = 0; i < count; i++) {
    calls.push(await runCall({ agent, toNumber, utterance }));
  }

  return NextResponse.json({ calls, count: calls.length }, { status: 201 });
}
