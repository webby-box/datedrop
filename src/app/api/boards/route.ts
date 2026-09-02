import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { boards, boardPlaces, places } from "@/lib/models";
import { mongoConfigured } from "@/lib/mongodb";
import { placeIdsLookupFilter } from "@/lib/places";

export async function GET() {
  try {
    const user = await requireUser();
    if (!mongoConfigured()) {
      return NextResponse.json({ boards: [], warning: "MONGODB_URI is not set." });
    }
    const list = await (await boards()).find({ userId: user.userId }).sort({ updatedAt: -1 }).toArray();
    const bp = await boardPlaces();
    const pl = await places();
    const out = [];
    for (const b of list) {
      const ids = await bp.find({ boardId: b._id!.toString() }).toArray();
      const saved = await pl.find(placeIdsLookupFilter(ids.map((i) => i.placeId))).toArray();
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

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!mongoConfigured()) {
      return NextResponse.json({ error: "MONGODB_URI is not set." }, { status: 503 });
    }
    const body = (await req.json()) as {
      title?: string;
      city?: string;
      country?: string;
      startDate?: string;
      endDate?: string;
      partySize?: number;
      lat?: number;
      lng?: number;
    };
    const city = String(body.city || "").trim();
    if (!city) {
      return NextResponse.json({ error: "City is required for a plan." }, { status: 400 });
    }
    const now = new Date();
    const title = String(body.title || city).trim() || city;
    const col = await boards();
    const existing = await col.findOne({ userId: user.userId, city });
    if (existing) {
      await col.updateOne(
        { _id: existing._id },
        {
          $set: {
            title,
            country: body.country || existing.country,
            startDate: body.startDate || existing.startDate,
            endDate: body.endDate || existing.endDate,
            partySize: Number(body.partySize) || existing.partySize || 2,
            ...(body.lat != null ? { lat: body.lat } : {}),
            ...(body.lng != null ? { lng: body.lng } : {}),
            updatedAt: now,
          },
        },
      );
      return NextResponse.json({ board: { ...existing, _id: existing._id!.toString(), title, startDate: body.startDate || existing.startDate, endDate: body.endDate || existing.endDate, partySize: Number(body.partySize) || existing.partySize || 2 } });
    }
    const inserted = await col.insertOne({
      userId: user.userId,
      title,
      city,
      country: body.country,
      lat: body.lat,
      lng: body.lng,
      startDate: body.startDate,
      endDate: body.endDate,
      partySize: Number(body.partySize) || 2,
      createdAt: now,
      updatedAt: now,
    });
    return NextResponse.json({
      board: {
        _id: inserted.insertedId.toString(),
        userId: user.userId,
        title,
        city,
        country: body.country,
        lat: body.lat,
        lng: body.lng,
        startDate: body.startDate,
        endDate: body.endDate,
        partySize: Number(body.partySize) || 2,
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
