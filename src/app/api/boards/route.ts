import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { boards, boardPlaces, places } from "@/lib/models";
import { mongoConfigured } from "@/lib/mongodb";

export async function GET() {
  try {
    const user = await requireUser();
    if (!mongoConfigured()) {
      return NextResponse.json({ boards: [], warning: "MONGODB_URI is not set." });
    }
    const list = await (await boards()).find({ userId: user.clerkId }).sort({ updatedAt: -1 }).toArray();
    const bp = await boardPlaces();
    const pl = await places();
    const out = [];
    for (const b of list) {
      const ids = await bp.find({ boardId: b._id!.toString() }).toArray();
      const saved = await pl.find({ googlePlaceId: { $in: ids.map((i) => i.placeId) } }).toArray();
      out.push({
        ...b,
        _id: b._id!.toString(),
        placeCount: ids.length,
        places: saved,
      });
    }
    return NextResponse.json({ boards: out });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
