import { NextResponse } from "next/server";
import { getEnvStatus } from "@/lib/env";

export async function GET() {
  const env = getEnvStatus();
  return NextResponse.json({
    ok: true,
    app: "datedrop",
    stack: {
      places: env.placesProvider,
      maps: "maplibre+openfreemap",
      llm: env.llmProvider,
      climate: "open-meteo",
      auth: "auth.js google",
      db: "mongodb",
    },
    env,
    note: env.missing.length
      ? "App boots with missing keys. Features that need them return readable errors. Places/maps work without Google billing."
      : "All required keys present (or free fallbacks active).",
  });
}
