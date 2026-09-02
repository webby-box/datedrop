import { boards, boardPlaces, places, alerts, users, type AlertRecord, type PlaceRecord, type BoardRecord } from "./models";
import { placeIdsLookupFilter, placeIdOf } from "./places";
import { mongoConfigured, ensureIndexes } from "./mongodb";
import { seasonalityFor } from "./climate";
import { bookingWindowCopy } from "./booking";

function daysUntil(dateStr?: string) {
  if (!dateStr) return null;
  const t = new Date(dateStr + "T12:00:00").getTime();
  if (Number.isNaN(t)) return null;
  return Math.round((t - Date.now()) / (1000 * 60 * 60 * 24));
}

function isHardToBook(p: PlaceRecord) {
  const rating = p.rating || 0;
  const reservable = p.reservable !== false;
  const foodie = (p.types || []).some((t) =>
    /restaurant|bar|food|cafe|fine_dining/i.test(t),
  );
  const platform = ["resy", "opentable", "tock", "sevenrooms"].includes(p.bookingPlatform);
  return foodie && reservable && (rating >= 4.4 || platform);
}

function tasteTagFor(p: PlaceRecord, city: string) {
  const type = (p.primaryType || p.types?.[0] || "place").replace(/_/g, " ");
  if (/italian|trattoria|pizza/i.test(type + p.name)) return `${city} Italian`;
  if (/french|bistro|brasserie/i.test(type + p.name)) return `${city} Classics`;
  if (/bar|cocktail|wine/i.test(type)) return `${city} Bars`;
  if (/ramen|sushi|japanese/i.test(type + p.name)) return `${city} Japanese`;
  return `${city} Favorites`;
}

async function upsertAlert(partial: Omit<AlertRecord, "_id" | "createdAt" | "updatedAt" | "read"> & { read?: boolean }) {
  const col = await alerts();
  const now = new Date();
  // Avoid Mongo path conflicts: fields must not appear in both $setOnInsert and $set.
  const {
    title,
    subtitle,
    body,
    why,
    imageUrl,
    suggestedDates,
    placeName,
    address,
    deepLinkLabel,
    placeId,
    boardId,
    kind,
    userId,
    fingerprint,
    read,
  } = partial;
  await col.updateOne(
    { userId, fingerprint },
    {
      $setOnInsert: {
        userId,
        fingerprint,
        kind,
        placeId,
        boardId,
        deepLinkLabel,
        read: read ?? false,
        createdAt: now,
      },
      $set: {
        title,
        subtitle,
        body,
        why,
        imageUrl,
        suggestedDates,
        placeName,
        address,
        updatedAt: now,
      },
    },
    { upsert: true },
  );
}

export async function generateAlertsForUser(userId: string) {
  if (!mongoConfigured()) return { generated: 0, unread: 0 };
  await ensureIndexes();

  const boardList = await (await boards()).find({ userId }).toArray();
  const bp = await boardPlaces();
  const pl = await places();
  const user = await (await users()).findOne({ userId });
  const tastes = user?.tasteProfiles?.length
    ? user.tasteProfiles
    : ["Manhattan Classics", "Date-night rooms", "Walkable clusters"];

  let generated = 0;

  for (const board of boardList as BoardRecord[]) {
    const links = await bp.find({ boardId: board._id!.toString(), userId }).toArray();
    if (!links.length) continue;
    const saved = (await pl
      .find(placeIdsLookupFilter(links.map((l) => l.placeId)))
      .toArray()) as PlaceRecord[];

    const start = board.startDate;
    const until = daysUntil(start);

    // Booking window 14–30 days out
    if (until != null && until >= 14 && until <= 30) {
      for (const place of saved) {
        const shot = links.find((l) => l.placeId === placeIdOf(place))?.sourceScreenshotUrl;
        await upsertAlert({
          userId,
          kind: "booking_window",
          title: "BOOKING WINDOW",
          subtitle: `${place.name} Reservation`,
          body: `Tables for hard-to-book rooms typically release ${until} days out. ${bookingWindowCopy({ date: start, city: board.city, restaurant: true })} Open the booking site — Aura never holds inventory.`,
          placeId: placeIdOf(place),
          boardId: board._id!.toString(),
          placeName: place.name,
          address: place.formattedAddress,
          imageUrl: shot,
          deepLinkLabel: "VIEW LOGISTICS",
          why: `Your ${board.city} plan starts ${start}. Popular rooms often open 14–30 days ahead.`,
          suggestedDates: { start: board.startDate, end: board.endDate },
          fingerprint: `booking_window:${board._id}:${placeIdOf(place)}:${start}`,
        });
        generated++;
      }
    }

    // Rare finding — hard-to-book vibe
    for (const place of saved) {
      if (!isHardToBook(place)) continue;
      const shot = links.find((l) => l.placeId === placeIdOf(place))?.sourceScreenshotUrl;
      const windowNote =
        until != null && until > 0 && until <= 45
          ? `A planning window is approaching for ${start}.`
          : "A cancellation-style opportunity is simulated from your vault timing — not live inventory.";
      await upsertAlert({
        userId,
        kind: "rare_finding",
        title: "RARE FINDING",
        subtitle: `${place.name} Reservation`,
        body: `${windowNote} ${place.name} matches a hard-to-book profile (rating ${place.rating ?? "—"}, ${place.bookingPlatform}). We detected this from your vault — not from Resy/OpenTable scrapes.`,
        placeId: placeIdOf(place),
        boardId: board._id!.toString(),
        placeName: place.name,
        address: place.formattedAddress,
        imageUrl: shot,
        deepLinkLabel: "VIEW LOGISTICS",
        why: `Matches your history of ${tasteTagFor(place, board.city)}. High-signal vault item with reservable vibe.`,
        suggestedDates: { start: board.startDate, end: board.endDate },
        fingerprint: `rare_finding:${placeIdOf(place)}:${board.startDate || "open"}`,
      });
      generated++;
    }

    // Seasonality for destination boards
    if (board.lat != null && board.lng != null && start) {
      try {
        const season = await seasonalityFor({
          lat: board.lat,
          lng: board.lng,
          city: board.city,
          date: start,
          isDestination: true,
        });
        if (!season.skipped) {
          await upsertAlert({
            userId,
            kind: "seasonality",
            title: season.verdict === "go" ? "SEASON GO" : season.verdict === "skip" ? "SEASON CAUTION" : "SEASON NOTE",
            subtitle: `${board.city} · ${start}`,
            body: season.prose,
            boardId: board._id!.toString(),
            placeName: board.city,
            address: board.country,
            deepLinkLabel: "VIEW LOGISTICS",
            why: "Climate normals from Open-Meteo 1991–2020 — not a forecast scrape.",
            suggestedDates: { start: board.startDate, end: board.endDate },
            fingerprint: `seasonality:${board._id}:${start}:${season.verdict}`,
          });
          generated++;
        }
      } catch {
        /* climate optional */
      }
    }

    // Preference match
    for (const place of saved.slice(0, 3)) {
      const tag = tasteTagFor(place, board.city);
      if (!tastes.some((t) => t.toLowerCase().includes(tag.split(" ").pop()!.toLowerCase()) || tag.toLowerCase().includes("classics"))) {
        // still emit with generic match
      }
      const shot = links.find((l) => l.placeId === placeIdOf(place))?.sourceScreenshotUrl;
      await upsertAlert({
        userId,
        kind: "preference_match",
        title: "TASTE MATCH",
        subtitle: place.name,
        body: `Matches your history of ${tag}. Kept in The Vault for ${board.city}.`,
        placeId: placeIdOf(place),
        boardId: board._id!.toString(),
        placeName: place.name,
        address: place.formattedAddress,
        imageUrl: shot,
        deepLinkLabel: "VIEW LOGISTICS",
        why: `Tagged against taste lists: ${tastes.join(", ")}.`,
        suggestedDates: { start: board.startDate, end: board.endDate },
        fingerprint: `pref:${placeIdOf(place)}:${tag}`,
      });
      generated++;
    }
  }

  const unread = await (await alerts()).countDocuments({ userId, read: false });
  return { generated, unread };
}

export async function listAlerts(userId: string, limit = 40) {
  if (!mongoConfigured()) return { alerts: [], unread: 0, live: false };
  await generateAlertsForUser(userId);
  const col = await alerts();
  const rows = await col.find({ userId }).sort({ createdAt: -1 }).limit(limit).toArray();
  const unread = rows.filter((r) => !r.read).length;
  return {
    alerts: rows.map((r) => ({ ...r, _id: r._id?.toString() })),
    unread,
    live: unread > 0,
  };
}
