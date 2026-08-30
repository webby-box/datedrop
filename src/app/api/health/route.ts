import { NextResponse } from "next/server";
import { getEnvStatus } from "@/lib/env";

export async function GET() {
  const env = getEnvStatus();
  return NextResponse.json({
    ok: true,
    app: "datedrop",
    env,
    note: env.missing.length
      ? "App boots with missing keys. Features that need them return readable errors."
      : "All keys present.",
  });
}
