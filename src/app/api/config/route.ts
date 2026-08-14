import { NextResponse } from "next/server";
import { features } from "@/lib/config";

export const dynamic = "force-dynamic";

/** Exposes non-secret capability flags so the UI can show live/demo status. */
export async function GET() {
  return NextResponse.json({ features: features() });
}
