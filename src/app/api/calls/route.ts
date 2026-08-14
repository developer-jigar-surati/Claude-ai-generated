import { NextResponse } from "next/server";
import { listCalls } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const agentId = url.searchParams.get("agentId") || undefined;
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "25", 10) || 25, 100);
  return NextResponse.json({ calls: await listCalls(agentId, limit) });
}
