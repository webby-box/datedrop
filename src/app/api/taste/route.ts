import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { users } from "@/lib/models";
import { mongoConfigured, ensureIndexes } from "@/lib/mongodb";

const DEFAULTS = ["Manhattan Classics", "Date-night rooms", "Walkable clusters", "Wine-forward"];

export async function GET() {
  try {
    const user = await requireUser();
    if (!mongoConfigured()) {
      return NextResponse.json({ profiles: DEFAULTS });
    }
    await ensureIndexes();
    const rec = await (await users()).findOne({ userId: user.userId });
    return NextResponse.json({ profiles: rec?.tasteProfiles?.length ? rec.tasteProfiles : DEFAULTS });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    if (!mongoConfigured()) {
      const body = (await req.json()) as { profiles?: string[] };
      const profiles = (body.profiles || [])
        .map((p) => String(p).trim())
        .filter(Boolean)
        .slice(0, 12);
      return NextResponse.json({
        profiles,
        persisted: false,
        note: "Demo session — taste chips update locally until MongoDB is configured.",
      });
    }
    const body = (await req.json()) as { profiles?: string[] };
    const profiles = (body.profiles || [])
      .map((p) => String(p).trim())
      .filter(Boolean)
      .slice(0, 12);
    await (await users()).updateOne(
      { userId: user.userId },
      {
        $set: { tasteProfiles: profiles, email: user.email },
        $setOnInsert: { userId: user.userId, createdAt: new Date() },
      },
      { upsert: true },
    );
    return NextResponse.json({ profiles });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
