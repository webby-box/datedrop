import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUser } from "@/lib/auth";
import { boards, boardPlaces, places } from "@/lib/models";
import { mongoConfigured } from "@/lib/mongodb";
import { nearbyRestaurants } from "@/lib/places";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!mongoConfigured()) {
      return NextResponse.json({ error: "MONGODB_URI is not set." }, { status: 503 });
    }
    const { id } = await ctx.params;
    const board = await (await boards()).findOne({ _id: new ObjectId(id), userId: user.clerkId });
    if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const links = await (await boardPlaces()).find({ boardId: id }).toArray();
    const saved = await (await places())
      .find({ googlePlaceId: { $in: links.map((l) => l.placeId) } })
      .toArray();
    let similar: Awaited<ReturnType<typeof nearbyRestaurants>> = [];
    if (board.lat && board.lng) {
      try {
        similar = (await nearbyRestaurants(board.lat, board.lng, 6)).filter(
          (m) => !saved.some((s) => s.googlePlaceId === m.googlePlaceId),
        );
      } catch {
        similar = [];
      }
    }
    return NextResponse.json({
      board: { ...board, _id: id },
      boardPlaces: links.map((l) => ({ ...l, _id: l._id?.toString() })),
      places: saved,
      similar,
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = (await req.json()) as {
      startDate?: string;
      endDate?: string;
      partySize?: number;
      title?: string;
    };
    const col = await boards();
    await col.updateOne(
      { _id: new ObjectId(id), userId: user.clerkId },
      {
        $set: {
          ...(body.startDate !== undefined ? { startDate: body.startDate } : {}),
          ...(body.endDate !== undefined ? { endDate: body.endDate } : {}),
          ...(body.partySize !== undefined ? { partySize: Number(body.partySize) || 2 } : {}),
          ...(body.title !== undefined ? { title: body.title } : {}),
          updatedAt: new Date(),
        },
      },
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
