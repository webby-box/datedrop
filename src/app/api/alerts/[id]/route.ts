import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUser } from "@/lib/auth";
import { alerts, places, boards, boardPlaces } from "@/lib/models";
import { mongoConfigured } from "@/lib/mongodb";
import { getOrCreateLogistics } from "@/lib/logistics";
import { bookingDeepLink } from "@/lib/booking";
import { placeLookupFilter, placeIdOf } from "@/lib/places";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!mongoConfigured()) {
      return NextResponse.json({ error: "MONGODB_URI is not set." }, { status: 503 });
    }
    const { id } = await ctx.params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const alert = await (await alerts()).findOne({ _id: new ObjectId(id), userId: user.userId });
    if (!alert) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await (await alerts()).updateOne({ _id: alert._id }, { $set: { read: true, updatedAt: new Date() } });

    let place = null;
    if (alert.placeId) {
      place = await (await places()).findOne(placeLookupFilter(alert.placeId));
    }

    let board = null;
    if (alert.boardId && ObjectId.isValid(alert.boardId)) {
      board = await (await boards()).findOne({ _id: new ObjectId(alert.boardId), userId: user.userId });
    }

    const logistics = alert.placeId
      ? await getOrCreateLogistics(user.userId, alert.placeId)
      : null;

    const book = place
      ? bookingDeepLink({
          name: place.name,
          websiteUri: place.websiteUri,
          platform: place.bookingPlatform,
          date: alert.suggestedDates?.start || board?.startDate,
          partySize: board?.partySize || 2,
        })
      : null;

    let screenshot: string | undefined = alert.imageUrl;
    if (!screenshot && alert.placeId) {
      const link = await (await boardPlaces()).findOne({ userId: user.userId, placeId: alert.placeId });
      screenshot = link?.sourceScreenshotUrl;
    }

    return NextResponse.json({
      alert: { ...alert, _id: alert._id?.toString(), read: true },
      place: place
        ? { ...place, _id: place._id?.toString(), id: placeIdOf(place) }
        : null,
      board: board ? { ...board, _id: board._id?.toString() } : null,
      logistics,
      booking: book,
      screenshot,
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
