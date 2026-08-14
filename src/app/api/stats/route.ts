import { NextResponse } from "next/server";
import { computeStats } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ stats: computeStats() });
}
