import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { mongoConfigured } from "@/lib/mongodb";
import { getOrCreateLogistics } from "@/lib/logistics";
import { places } from "@/lib/models";
import { placeLookupFilter, placeIdOf } from "@/lib/places";
import { bookingDeepLink } from "@/lib/booking";

export async function GET(_req: Request, ctx: { params: Promise<{ placeId: string }> }) {
  try {
    const user = await requireUser();
    if (!mongoConfigured()) {
      return NextResponse.json({ error: "MONGODB_URI is not set." }, { status: 503 });
    }
    const { placeId } = await ctx.params;
    const decoded = decodeURIComponent(placeId);
    const logistics = await getOrCreateLogistics(user.userId, decoded);
    const place = await (await places()).findOne(placeLookupFilter(decoded));
    const booking = place
      ? bookingDeepLink({
          name: place.name,
          websiteUri: place.websiteUri,
          platform: place.bookingPlatform,
        })
      : null;
    return NextResponse.json({
      logistics,
      place: place ? { ...place, id: placeIdOf(place) } : null,
      booking,
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
