import type { Candidate, Extraction, SourceHint } from "./types";

const MODEL = "gemini-2.5-flash";

const SYSTEM = `You extract places from screenshots for DateDrop.
DateDrop is ReciMe-for-places: people drop screenshots of restaurants and trips.

Return ONLY JSON matching:
{ "summary": string, "candidates": [{ "kind": "restaurant"|"place"|"destination"|"unknown", "name": string, "city": string|null, "neighborhood": string|null, "country": string|null, "cues": string[], "confidence": number, "sourceHint": "google_maps"|"apple_maps"|"instagram"|"tiktok"|"resy"|"opentable"|"tock"|"tripadvisor"|"other" }] }

Rules:
- Only extract what is visible. If unreadable, kind=unknown and say so in cues.
- Do NOT invent famous restaurants from generic food photos.
- Treat Maps chrome as strong cues: red pin, Directions, Save, rating row (stars + review count), bottom-sheet place name, Google/Apple/Bing wordmarks, Street View overlays, share sheets.
- sourceHint: google_maps for Google Maps UI; apple_maps for Apple Maps; instagram/tiktok for those overlays; resy/opentable/tock for booking apps; tripadvisor for TA/Eater/Infatuation cards; other otherwise.
- Destinations (city skylines, postcards with captions) are kind=destination.
- confidence is 0-1.
- Never include booking slot grids or invent availability.`;

export function mockExtraction(hint?: string): Extraction {
  const fromMaps = /maps|pin|google/i.test(hint || "");
  return {
    summary: fromMaps
      ? "Google Maps place card with a named restaurant in New York."
      : "Restaurant screenshot mentioning Carbone in New York.",
    candidates: [
      {
        kind: "restaurant",
        name: fromMaps ? "Lilia" : "Carbone",
        city: "New York",
        neighborhood: fromMaps ? "Williamsburg" : "Greenwich Village",
        country: "United States",
        cues: fromMaps
          ? ["red pin", "Directions", "Save", "rating row", "bottom-sheet name"]
          : ["Carbone", "New York", "Italian"],
        confidence: 0.86,
        sourceHint: fromMaps ? "google_maps" : "other",
        matches: [],
      },
    ],
  };
}

function parseJson(text: string): Extraction {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned) as Extraction;
  const candidates: Candidate[] = (parsed.candidates || []).map((c) => ({
    kind: c.kind || "unknown",
    name: String(c.name || "Unknown").slice(0, 200),
    city: c.city || undefined,
    neighborhood: c.neighborhood || undefined,
    country: c.country || undefined,
    cues: Array.isArray(c.cues) ? c.cues.map(String).slice(0, 12) : [],
    confidence: Math.max(0, Math.min(1, Number(c.confidence) || 0)),
    sourceHint: (c.sourceHint || "other") as SourceHint,
    matches: [],
  }));
  return { summary: String(parsed.summary || "").slice(0, 500), candidates };
}

export async function extractFromImages(
  images: { mime: string; bytes: Buffer }[],
): Promise<Extraction> {
  if (process.env.MOCK_AI === "1") return mockExtraction("maps");
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local to extract places from screenshots.",
    );
  }

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
    systemInstruction: SYSTEM,
  });

  const parts = [
    {
      text: "Extract every distinct place visible in these screenshots. Maps chrome (pin, Directions, Save, rating row, bottom sheet) is a strong cue.",
    },
    ...images.map((img) => ({
      inlineData: {
        mimeType: img.mime,
        data: img.bytes.toString("base64"),
      },
    })),
  ];

  const result = await model.generateContent(parts);
  const text = result.response.text();
  return parseJson(text);
}

export async function writeSeasonalityProse(input: {
  city: string;
  monthName: string;
  meanMaxC: number;
  meanMinC: number;
  precipMm: number;
  verdict: string;
}): Promise<string> {
  const fallback = `${input.city} in ${input.monthName}: typical highs ${Math.round(input.meanMaxC)}°C / lows ${Math.round(input.meanMinC)}°C, ~${Math.round(input.precipMm)} mm of rain. Verdict: ${input.verdict}.`;
  if (process.env.MOCK_AI === "1" || !process.env.GEMINI_API_KEY) return fallback;
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: { temperature: 0.4 },
    });
    const result = await model.generateContent(
      `Write 2 short sentences of travel-seasonality copy. Use ONLY these numbers, do not invent weather: city=${input.city}, month=${input.monthName}, meanMaxC=${input.meanMaxC}, meanMinC=${input.meanMinC}, precipMm=${input.precipMm}, verdict=${input.verdict}. No packing lists. No flights.`,
    );
    return result.response.text().trim() || fallback;
  } catch {
    return fallback;
  }
}

export async function writeItineraryProse(input: {
  city: string;
  dates: string;
  partySize: number;
  places: { name: string; neighborhood?: string }[];
}): Promise<string> {
  const names = input.places.map((p) => p.name).join(", ");
  const fallback = `${input.city} · ${input.dates} · party of ${input.partySize}. Cluster ${names} by walking distance. Book on the provider sites — DateDrop does not hold tables.`;
  if (process.env.MOCK_AI === "1" || !process.env.GEMINI_API_KEY) return fallback;
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL, generationConfig: { temperature: 0.5 } });
    const result = await model.generateContent(
      `One paragraph itinerary intro for a date-night / trip board. City ${input.city}, ${input.dates}, party of ${input.partySize}. Places (from THIS user's screenshots only): ${names}. Do not add famous restaurants they did not save. Mention they book on Resy/OpenTable/Tock themselves.`,
    );
    return result.response.text().trim() || fallback;
  } catch {
    return fallback;
  }
}
