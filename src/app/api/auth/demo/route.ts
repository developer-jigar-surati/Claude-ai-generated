import { NextResponse } from "next/server";
import { demoEmail, demoPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Surfaces the demo login hint on the sign-in page. The password is only
 * revealed while the built-in default is in use; if you set a custom
 * DEMO_PASSWORD in .env, it is never exposed here.
 */
export async function GET() {
  const usingDefault = demoPassword() === "demo1234";
  return NextResponse.json({
    email: demoEmail(),
    password: usingDefault ? demoPassword() : null,
    usingDefault,
  });
}
