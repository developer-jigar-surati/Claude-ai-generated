import { NextResponse } from "next/server";
import { analyticsSeries, computeStats, listAgentsWithMetrics } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const [stats, series, agents] = await Promise.all([
    computeStats(),
    analyticsSeries(7),
    listAgentsWithMetrics(),
  ]);
  return NextResponse.json({ stats, series, agents });
}
