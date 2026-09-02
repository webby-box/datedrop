import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUser } from "@/lib/auth";
import { places, boardPlaces, boards } from "@/lib/models";
import { mongoConfigured } from "@/lib/mongodb";
import { placeLookupFilter, placeIdOf } from "@/lib/places";
import { getOrCreateLogistics } from "@/lib/logistics";
import { bookingDeepLink, NO_INVENTORY_COPY } from "@/lib/booking";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!mongoConfigured()) {
      return NextResponse.json({ error: "MONGODB_URI is not set." }, { status: 503 });
    }
    const { id } = await ctx.params;
    const place = await (await places()).findOne(placeLookupFilter(id));
    if (!place) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const pid = placeIdOf(place);

    const links = await (await boardPlaces())
      .find({ userId: user.userId, placeId: { $in: [id, pid].filter(Boolean) } })
      .toArray();
    if (!links.length) {
      return NextResponse.json({ error: "Not in your vault" }, { status: 404 });
    }

    let board = null;
    const boardId = links[0]?.boardId;
    if (boardId && ObjectId.isValid(boardId)) {
      board = await (await boards()).findOne({ _id: new ObjectId(boardId), userId: user.userId });
    }

    const logistics = await getOrCreateLogistics(user.userId, pid || id);
    const date = new URL(req.url).searchParams.get("date") || board?.startDate || undefined;
    const party = Number(new URL(req.url).searchParams.get("party") || board?.partySize || 2);
    const book = bookingDeepLink({
      name: place.name,
      websiteUri: place.websiteUri,
      platform: place.bookingPlatform,
      date,
      partySize: party,
    });

    return NextResponse.json({
      place: {
        ...place,
        _id: place._id?.toString(),
        placeId: pid,
        externalPlaceId: pid,
      },
      board: board ? { ...board, _id: board._id?.toString() } : null,
      boardPlaces: links.map((l) => ({ ...l, _id: l._id?.toString() })),
      imageUrl: links.find((l) => l.sourceScreenshotUrl)?.sourceScreenshotUrl,
      logistics,
      booking: book,
      copy: NO_INVENTORY_COPY,
      draftPlan: {
        boardId: board?._id?.toString(),
        dates: { start: board?.startDate, end: board?.endDate },
        partySize: board?.partySize || 2,
        city: board?.city,
      },
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
