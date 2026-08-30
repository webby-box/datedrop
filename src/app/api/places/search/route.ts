import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { textSearch } from "@/lib/places";

export async function GET(req: Request) {
  try {
    await requireUser();
    const q = new URL(req.url).searchParams.get("q") || "";
    if (q.trim().length < 2) return NextResponse.json({ matches: [] });
    const matches = await textSearch(q.trim(), 5);
    return NextResponse.json({ matches });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
