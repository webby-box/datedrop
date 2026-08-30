import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { mongoConfigured, getDb } from "@/lib/mongodb";

export async function POST() {
  try {
    const user = await requireUser();
    if (!mongoConfigured()) {
      return NextResponse.json({ ok: true, note: "No database configured — nothing to delete." });
    }
    const db = await getDb();
    const uid = user.clerkId;
    await Promise.all([
      db.collection("captures").deleteMany({ userId: uid }),
      db.collection("boards").deleteMany({ userId: uid }),
      db.collection("boardPlaces").deleteMany({ userId: uid }),
      db.collection("plans").deleteMany({ userId: uid }),
      db.collection("users").deleteMany({ clerkId: uid }),
      db.collection("rateLimits").deleteMany({ key: `capture:${uid}` }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
