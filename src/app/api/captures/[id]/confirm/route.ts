import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUser } from "@/lib/auth";
import { captures, boards, boardPlaces } from "@/lib/models";
import { mongoConfigured } from "@/lib/mongodb";
import { textSearch, upsertPlaceFromMatch } from "@/lib/places";
import type { PlaceMatch } from "@/lib/types";

function cityFromAddress(addr: string, fallback?: string) {
  const parts = addr.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 3] || parts[0] || fallback || "Unknown city";
  return fallback || parts[0] || "Unknown city";
}

function countryFromAddress(addr: string) {
  const parts = addr.split(",").map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1];
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!mongoConfigured()) {
      return NextResponse.json({ error: "MONGODB_URI is not set." }, { status: 503 });
    }
    const { id } = await ctx.params;
    const body = (await req.json()) as {
      action: "save" | "skip" | "not_a_place" | "search";
      candidateIndex?: number;
      matchIndex?: number;
      googlePlaceId?: string;
      query?: string;
    };

    const capCol = await captures();
    const rec = await capCol.findOne({ _id: new ObjectId(id), userId: user.clerkId });
    if (!rec) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (body.action === "skip" || body.action === "not_a_place") {
      await capCol.updateOne(
        { _id: rec._id },
        { $set: { status: "saved", updatedAt: new Date(), skipped: true, skipReason: body.action } },
      );
      return NextResponse.json({ ok: true, status: "saved" });
    }

    let match: PlaceMatch | undefined;
    if (body.action === "search" && body.query) {
      const found = await textSearch(body.query, 3);
      return NextResponse.json({ matches: found });
    }

    if (body.googlePlaceId) {
      const all = rec.extraction?.candidates.flatMap((c) => c.matches) || [];
      match = all.find((m) => m.googlePlaceId === body.googlePlaceId);
      if (!match) {
        const found = await textSearch(body.googlePlaceId, 1);
        match = found[0];
      }
    } else {
      const cand = rec.extraction?.candidates[body.candidateIndex ?? 0];
      match = cand?.matches[body.matchIndex ?? 0];
    }

    if (!match) {
      return NextResponse.json(
        { error: "Pick a Google Place match. DateDrop never auto-saves a guess." },
        { status: 400 },
      );
    }

    const place = await upsertPlaceFromMatch(match);
    const city = cityFromAddress(place.formattedAddress, rec.extraction?.candidates[0]?.city);
    const country = countryFromAddress(place.formattedAddress);
    const boardCol = await boards();
    let board = await boardCol.findOne({ userId: user.clerkId, city });
    if (!board) {
      const now = new Date();
      const inserted = await boardCol.insertOne({
        userId: user.clerkId,
        title: city,
        city,
        country,
        lat: place.lat,
        lng: place.lng,
        partySize: 2,
        createdAt: now,
        updatedAt: now,
      });
      board = await boardCol.findOne({ _id: inserted.insertedId });
    }

    const bp = await boardPlaces();
    await bp.updateOne(
      { boardId: board!._id!.toString(), placeId: place.googlePlaceId },
      {
        $setOnInsert: {
          boardId: board!._id!.toString(),
          userId: user.clerkId,
          placeId: place.googlePlaceId,
          captureId: id,
          sourceScreenshotUrl: rec.blobUrls[0],
          status: "want",
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    await capCol.updateOne(
      { _id: rec._id },
      { $set: { status: "saved", updatedAt: new Date() } },
    );

    return NextResponse.json({
      ok: true,
      boardId: board!._id!.toString(),
      placeId: place.googlePlaceId,
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
