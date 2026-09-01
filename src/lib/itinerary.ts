import type { PlanDay } from "./types";
import { haversineMeters } from "./utils";
import { nearbyAttractions } from "./places";
import type { PlaceRecord } from "./models";
import { placeIdOf } from "./places";

function eachDate(start: string, end: string) {
  const out: string[] = [];
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
    if (out.length > 14) break;
  }
  return out.length ? out : [start];
}

function clusterPlaces(places: PlaceRecord[]) {
  const remaining = [...places];
  const clusters: PlaceRecord[][] = [];
  while (remaining.length) {
    const seed = remaining.shift()!;
    const group = [seed];
    for (let i = remaining.length - 1; i >= 0; i--) {
      if (haversineMeters(seed, remaining[i]) <= 900) {
        group.push(remaining[i]);
        remaining.splice(i, 1);
      }
    }
    clusters.push(group);
  }
  return clusters.sort((a, b) => b.length - a.length);
}

export async function buildDays(opts: {
  city: string;
  start: string;
  end: string;
  places: PlaceRecord[];
  lat?: number;
  lng?: number;
}): Promise<PlanDay[]> {
  const dates = eachDate(opts.start, opts.end);
  const saved = opts.places;
  const clusters = clusterPlaces(saved);
  const days: PlanDay[] = [];

  let extra: { name: string; suggested: true }[] = [];
  if (saved.length < 3 && opts.lat != null && opts.lng != null) {
    const attr = await nearbyAttractions(opts.lat, opts.lng, 2);
    extra = attr.map((a) => ({ name: a.name, suggested: true as const }));
  }

  dates.forEach((date, i) => {
    const cluster = clusters[i % Math.max(clusters.length, 1)] || [];
    const items: PlanDay["items"] = cluster.map((p, idx) => ({
      placeId: placeIdOf(p),
      name: p.name,
      window: idx === 0 ? "Lunch / early" : idx === 1 ? "Golden hour" : "Dinner",
      note: p.primaryType?.replace(/_/g, " ") || "From your screenshots",
    }));
    if (i === 0) {
      extra.forEach((e) =>
        items.push({
          placeId: undefined,
          name: e.name,
          window: "Between meals",
          note: "Suggested, not from your screenshots",
          suggested: true,
        }),
      );
    }
    days.push({
      date,
      title: cluster.length
        ? `${opts.city} · ${cluster[0]?.name || "day"} cluster`
        : `${opts.city} · open day`,
      items,
    });
  });
  return days;
}
