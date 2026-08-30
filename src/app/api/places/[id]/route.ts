import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { places, boardPlaces } from "@/lib/models";
import { mongoConfigured } from "@/lib/mongodb";
import { nearbyRestaurants } from "@/lib/places";
import { bookingDeepLink, NO_INVENTORY_COPY } from "@/lib/booking";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!mongoConfigured()) {
      return NextResponse.json({ error: "MONGODB_URI is not set." }, { status: 503 });
    }
    const { id } = await ctx.params;
    const place = await (await places()).findOne({ googlePlaceId: id });
    if (!place) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const shots = await (await boardPlaces())
      .find({ userId: user.clerkId, placeId: id })
      .toArray();
    let similar: Awaited<ReturnType<typeof nearbyRestaurants>> = [];
    try {
      similar = await nearbyRestaurants(place.lat, place.lng, 5);
    } catch {
      similar = [];
    }
    const party = Number(new URL(req.url).searchParams.get("party") || 2);
    const date = new URL(req.url).searchParams.get("date") || undefined;
    const book = bookingDeepLink({
      name: place.name,
      websiteUri: place.websiteUri,
      platform: place.bookingPlatform,
      date,
      partySize: party,
    });
    return NextResponse.json({
      place,
      screenshots: shots.map((s) => s.sourceScreenshotUrl).filter(Boolean),
      similar,
      book,
      copy: NO_INVENTORY_COPY,
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
