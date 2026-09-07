import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { boards, boardPlaces, places } from "@/lib/models";
import { mongoConfigured } from "@/lib/mongodb";
import { placeIdsLookupFilter, placeIdOf, nearbyRestaurants } from "@/lib/places";
import { getOrCreateLogistics } from "@/lib/logistics";
import { bookingDeepLink } from "@/lib/booking";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    if (!mongoConfigured()) {
      return NextResponse.json({ items: [], warning: "MONGODB_URI is not set." });
    }
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const city = (url.searchParams.get("city") || "").toLowerCase();
    const type = (url.searchParams.get("type") || "").toLowerCase();
    const occasion = (url.searchParams.get("occasion") || "").toLowerCase();
    const withLogistics = url.searchParams.get("logistics") === "1";

    const boardList = await (await boards()).find({ userId: user.userId }).toArray();
    const bp = await boardPlaces();
    const pl = await places();
    const items = [];

    for (const b of boardList) {
      const links = await bp.find({ boardId: b._id!.toString() }).toArray();
      const saved = await pl.find(placeIdsLookupFilter(links.map((l) => l.placeId))).toArray();
      for (const place of saved) {
        const link = links.find((l) => l.placeId === placeIdOf(place));
        const row = {
          placeId: placeIdOf(place),
          name: place.name,
          address: place.formattedAddress,
          city: b.city,
          country: b.country,
          lat: place.lat,
          lng: place.lng,
          rating: place.rating,
          primaryType: place.primaryType,
          types: place.types,
          bookingPlatform: place.bookingPlatform,
          websiteUri: place.websiteUri,
          googleMapsUri: place.googleMapsUri,
          boardId: b._id!.toString(),
          imageUrl: link?.sourceScreenshotUrl,
          status: link?.status || "want",
          occasion: link?.occasion || "want",
          booking: bookingDeepLink({
            name: place.name,
            websiteUri: place.websiteUri,
            platform: place.bookingPlatform,
            date: b.startDate,
            partySize: b.partySize || 2,
          }),
        };
        if (q && !`${row.name} ${row.address} ${row.city}`.toLowerCase().includes(q)) continue;
        if (city && !row.city.toLowerCase().includes(city)) continue;
        if (occasion && (row.occasion || "want") !== occasion) continue;
        if (type && !(row.primaryType || "").toLowerCase().includes(type) && !(row.types || []).some((t) => t.toLowerCase().includes(type))) continue;
        items.push(row);
      }
    }

    let similar: Awaited<ReturnType<typeof nearbyRestaurants>> = [];
    if (items[0]) {
      try {
        similar = await nearbyRestaurants(items[0].lat, items[0].lng, 4);
      } catch {
        similar = [];
      }
    }

    if (withLogistics && items[0]) {
      const logistics = await getOrCreateLogistics(user.userId, items[0].placeId);
      return NextResponse.json({ items, similar, logistics });
    }

    return NextResponse.json({
      items,
      similar,
      cities: [...new Set(items.map((i) => i.city))].sort(),
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
