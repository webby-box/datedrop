import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUser } from "@/lib/auth";
import { captures } from "@/lib/models";
import { mongoConfigured } from "@/lib/mongodb";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!mongoConfigured()) {
      return NextResponse.json({ error: "MONGODB_URI is not set." }, { status: 503 });
    }
    const { id } = await ctx.params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const rec = await (await captures()).findOne({ _id: new ObjectId(id), userId: user.clerkId });
    if (!rec) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ capture: { ...rec, _id: rec._id?.toString() } });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
