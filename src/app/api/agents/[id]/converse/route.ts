import { NextResponse } from "next/server";
import { getAgent } from "@/lib/store";
import { converse, Turn } from "@/lib/llm";
import { logBrowserVoiceCall } from "@/lib/callEngine";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Drives the in-browser voice test.
 *   { message, history }   -> { reply, intent, source }   (one conversation turn)
 *   { finalize: true, history } -> logs the call, returns { logged: true }
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = await getAgent(id);
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const history: Turn[] = Array.isArray(body.history)
    ? body.history
        .filter((t: unknown) => t && typeof t === "object")
        .map((t: { role?: string; text?: unknown }) => ({
          role: t.role === "agent" ? "agent" : "customer",
          text: String(t.text ?? ""),
        }))
    : [];

  if (body.finalize) {
    if (history.length === 0) return NextResponse.json({ logged: false });
    const call = await logBrowserVoiceCall(agent, history);
    return NextResponse.json({ logged: true, call });
  }

  const message = String(body.message || "");
  if (!message.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const result = await converse(agent, history, message);
  return NextResponse.json(result);
}
