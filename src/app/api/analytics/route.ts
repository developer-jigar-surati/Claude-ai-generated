import { NextResponse } from "next/server";
import { analyticsSeries, computeStats, listAgentsWithMetrics } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    stats: computeStats(),
    series: analyticsSeries(7),
    agents: listAgentsWithMetrics(),
  });
}
