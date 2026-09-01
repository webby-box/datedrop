import type { ClimateVerdict, Seasonality } from "./types";
import { writeSeasonalityProse } from "./llm";
import { mongoConfigured, getDb } from "./mongodb";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function roundCoord(n: number) {
  return Math.round(n * 20) / 20;
}

function verdictFrom(meanMaxC: number, precipMm: number, precipByMonth: number[]): ClimateVerdict {
  const sorted = [...precipByMonth].sort((a, b) => b - a);
  const worst3 = new Set(sorted.slice(0, 3));
  const isWorstPrecip = worst3.has(precipMm);
  if (meanMaxC >= 38 || meanMaxC <= 0) return "skip";
  if (meanMaxC >= 15 && meanMaxC <= 28 && !isWorstPrecip) return "go";
  return "caution";
}

type ClimateRow = { month: number; meanMaxC: number; meanMinC: number; precipMm: number };

async function fetchArchive(lat: number, lng: number): Promise<ClimateRow[]> {
  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("start_date", "1991-01-01");
  url.searchParams.set("end_date", "2020-12-31");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum");
  url.searchParams.set("timezone", "UTC");
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo archive failed (${res.status})`);
  const json = (await res.json()) as {
    daily: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_sum: number[] };
  };
  const buckets = Array.from({ length: 12 }, () => ({ max: 0, min: 0, precip: 0, n: 0 }));
  json.daily.time.forEach((t, i) => {
    const m = new Date(t).getUTCMonth();
    buckets[m].max += json.daily.temperature_2m_max[i] ?? 0;
    buckets[m].min += json.daily.temperature_2m_min[i] ?? 0;
    buckets[m].precip += json.daily.precipitation_sum[i] ?? 0;
    buckets[m].n += 1;
  });
  return buckets.map((b, i) => ({
    month: i + 1,
    meanMaxC: b.n ? b.max / b.n : 0,
    meanMinC: b.n ? b.min / b.n : 0,
    precipMm: b.n ? (b.precip / b.n) * 30 : 0,
  }));
}

export async function seasonalityFor(opts: {
  lat: number;
  lng: number;
  city: string;
  date: string;
  isDestination: boolean;
}): Promise<Seasonality> {
  if (!opts.isDestination) {
    return {
      verdict: "go",
      month: new Date(opts.date).getMonth() + 1,
      meanMaxC: 0,
      meanMinC: 0,
      precipMm: 0,
      prose: "Home-city restaurant board — climate skipped. Watch booking windows instead.",
      skipped: true,
      skipReason: "home_city",
    };
  }

  const lat = roundCoord(opts.lat);
  const lng = roundCoord(opts.lng);
  const cacheKey = `${lat},${lng}`;
  let rows: ClimateRow[] | null = null;

  if (mongoConfigured()) {
    try {
      const db = await getDb();
      const hit = await db.collection("climateCache").findOne({ key: cacheKey });
      if (hit?.rows) rows = hit.rows as ClimateRow[];
    } catch {
      rows = null;
    }
  }

  if (!rows) {
    rows = await fetchArchive(lat, lng);
    if (mongoConfigured()) {
      try {
        const db = await getDb();
        await db.collection("climateCache").updateOne(
          { key: cacheKey },
          { $set: { key: cacheKey, rows, fetchedAt: new Date(), attribution: "Climate data: Open-Meteo archive 1991–2020" } },
          { upsert: true },
        );
      } catch { /* cache is best-effort */ }
    }
  }

  const month = new Date(opts.date + "T12:00:00").getMonth() + 1;
  const row = rows.find((r) => r.month === month) || rows[0];
  const v = verdictFrom(row.meanMaxC, row.precipMm, rows.map((r) => r.precipMm));
  const prose = await writeSeasonalityProse({
    city: opts.city,
    monthName: MONTHS[month - 1],
    meanMaxC: row.meanMaxC,
    meanMinC: row.meanMinC,
    precipMm: row.precipMm,
    verdict: v,
  });
  return {
    verdict: v,
    month,
    meanMaxC: row.meanMaxC,
    meanMinC: row.meanMinC,
    precipMm: row.precipMm,
    prose,
  };
}
