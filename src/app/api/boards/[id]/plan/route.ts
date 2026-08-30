import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUser } from "@/lib/auth";
import { boards, boardPlaces, places, plans } from "@/lib/models";
import { mongoConfigured } from "@/lib/mongodb";
import { seasonalityFor } from "@/lib/climate";
import { buildDays } from "@/lib/itinerary";
import { bookingDeepLink, bookingWindowCopy, NO_INVENTORY_COPY } from "@/lib/booking";
import { writeItineraryProse } from "@/lib/gemini";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!mongoConfigured()) {
      return NextResponse.json({ error: "MONGODB_URI is not set." }, { status: 503 });
    }
    const { id } = await ctx.params;
    const plan = await (await plans()).findOne({ boardId: id, userId: user.clerkId });
    return NextResponse.json({ plan: plan ? { ...plan, _id: plan._id?.toString() } : null });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!mongoConfigured()) {
      return NextResponse.json({ error: "MONGODB_URI is not set." }, { status: 503 });
    }
    const { id } = await ctx.params;
    const board = await (await boards()).findOne({ _id: new ObjectId(id), userId: user.clerkId });
    if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const start = board.startDate || new Date().toISOString().slice(0, 10);
    const end = board.endDate || start;
    const links = await (await boardPlaces()).find({ boardId: id }).toArray();
    const saved = await (await places())
      .find({ googlePlaceId: { $in: links.map((l) => l.placeId) } })
      .toArray();

    const restaurantHeavy = saved.filter((p) =>
      (p.types || []).some((t) => t.includes("restaurant") || t.includes("food") || t.includes("bar")),
    );
    const isDestination = saved.length > 0 && restaurantHeavy.length < saved.length * 0.7
      ? true
      : Boolean(board.country && board.country !== "United States" && board.city);

    // Home-city restaurant boards skip climate
    const looksLikeHomeRestaurantBoard =
      restaurantHeavy.length >= Math.max(1, saved.length - 1) && !board.country?.match(/Italy|France|Japan|Spain|Mexico|UK|United Kingdom/);

    let seasonality;
    try {
      seasonality = await seasonalityFor({
        lat: board.lat || saved[0]?.lat || 0,
        lng: board.lng || saved[0]?.lng || 0,
        city: board.city,
        date: start,
        isDestination: !looksLikeHomeRestaurantBoard,
      });
    } catch (err) {
      seasonality = {
        verdict: "caution" as const,
        month: new Date(start).getMonth() + 1,
        meanMaxC: 0,
        meanMinC: 0,
        precipMm: 0,
        prose: `Climate lookup failed: ${(err as Error).message}. Open-Meteo attribution still applies when data loads.`,
        skipped: true,
        skipReason: "fetch_failed",
      };
    }

    const days = await buildDays({
      city: board.city,
      start,
      end,
      places: saved,
      lat: board.lat,
      lng: board.lng,
    });

    const intro = await writeItineraryProse({
      city: board.city,
      dates: `${start} → ${end}`,
      partySize: board.partySize || 2,
      places: saved.map((p) => ({ name: p.name })),
    });

    const checklist = saved.map((p) => {
      const link = bookingDeepLink({
        name: p.name,
        websiteUri: p.websiteUri,
        platform: p.bookingPlatform,
        date: start,
        partySize: board.partySize || 2,
      });
      return {
        placeId: p.googlePlaceId,
        name: p.name,
        ...link,
        copy: bookingWindowCopy({ date: start, city: board.city, restaurant: true }),
      };
    });

    const record = {
      boardId: id,
      userId: user.clerkId,
      dates: { start, end },
      partySize: board.partySize || 2,
      seasonality,
      days,
      bookingCopy: `${intro}\n\n${NO_INVENTORY_COPY}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await (await plans()).updateOne(
      { boardId: id, userId: user.clerkId },
      { $set: record },
      { upsert: true },
    );

    return NextResponse.json({ plan: record, checklist, attribution: "Climate: Open-Meteo archive 1991–2020." });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
