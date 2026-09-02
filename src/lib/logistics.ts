import { venueLogistics, places, type PlaceRecord } from "./models";
import { placeLookupFilter, placeIdOf } from "./places";
import { mongoConfigured } from "./mongodb";
import { resolveLlmProvider } from "./llm";

export type VenueLogisticsCopy = {
  bookingStrategy: string;
  poseDirection: string;
  optimalSetting: string;
};

function heuristicLogistics(place: PlaceRecord): VenueLogisticsCopy {
  const name = place.name;
  const type = (place.primaryType || "restaurant").replace(/_/g, " ");
  const platform = place.bookingPlatform;
  const rating = place.rating;

  const bookingStrategy =
    platform === "resy" || platform === "opentable" || platform === "tock"
      ? `${name} is typically booked on ${platform}. Aim for the 14–30 day release window for prime dinner; midweek lunch is often quieter. Walk-ins (if any) favor early arrival before the rush — Aura does not read live availability.`
      : `Check the restaurant site or Maps listing for ${name}. For ${type} rooms, arrive 10–15 minutes early for bar seating when the dining room is full. Aura opens outbound links only — no inventory scrape.`;

  const poseDirection =
    rating && rating >= 4.5
      ? `Lean into soft evening light at ${name}. Frame the room's signature texture — marble, banquettes, or window glow — rather than flash. A three-quarter table vignette with glassware reads editorial; keep faces natural and unposed.`
      : `At ${name}, shoot from seated eye-level toward the room's deepest corner. Avoid harsh overhead LEDs; wait for candle or street light. Capture one plate detail and one architectural line.`;

  const optimalSetting =
    `Optimal setting: party of 2, golden-hour arrival or 7:30–8:30 dinner. Neighborhood energy around ${place.formattedAddress.split(",").slice(-3, -1).join(",").trim() || "the area"} pairs well with a short walk before or after. Dress code: polished casual unless the room signals black-tie.`;

  return { bookingStrategy, poseDirection, optimalSetting };
}

async function llmLogistics(place: PlaceRecord): Promise<VenueLogisticsCopy | null> {
  const key = process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
  if (!key || process.env.MOCK_AI === "1") return null;

  const prompt = `You are Aura Concierge Elite, a luxury dining advisor.
Given this venue metadata ONLY (no live booking data), write JSON with three short polished paragraphs:
{
  "bookingStrategy": "walk-ins / best arrival times / typical release windows — never invent live table times",
  "poseDirection": "tasteful photo / pose tips for guests at this room",
  "optimalSetting": "party size vibe, time of day, neighborhood pairing, dress"
}
Venue: ${place.name}
Address: ${place.formattedAddress}
Type: ${place.primaryType || place.types?.join(", ")}
Rating: ${place.rating ?? "n/a"}
Platform hint: ${place.bookingPlatform}
Rules: Do NOT claim live Resy/OpenTable availability. Do NOT invent specific open slots. Keep each field 2-4 sentences, editorial luxury tone.`;

  try {
    if (process.env.OPENROUTER_API_KEY) {
      const models = [
        process.env.OPENROUTER_VISION_MODEL || "minimax/minimax-m3:free",
        "google/gemma-4-31b-it:free",
        "openrouter/free",
      ];
      for (const model of models) {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.AUTH_URL || "https://datedrop.onrender.com",
            "X-Title": "Aura Concierge Elite",
          },
          body: JSON.stringify({
            model,
            temperature: 0.5,
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }],
          }),
        });
        if (!res.ok) continue;
        const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const text = json.choices?.[0]?.message?.content || "";
        const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
        const parsed = JSON.parse(cleaned) as VenueLogisticsCopy;
        if (parsed.bookingStrategy && parsed.poseDirection && parsed.optimalSetting) return parsed;
      }
    }
    if (process.env.GROQ_API_KEY) {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.GROQ_VISION_MODEL || "qwen/qwen3.6-27b",
          temperature: 0.5,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const parsed = JSON.parse(json.choices?.[0]?.message?.content || "{}") as VenueLogisticsCopy;
        if (parsed.bookingStrategy && parsed.poseDirection && parsed.optimalSetting) return parsed;
      }
    }
  } catch {
    return null;
  }
  void resolveLlmProvider;
  return null;
}

export async function getOrCreateLogistics(userId: string, placeId: string): Promise<VenueLogisticsCopy & { placeId: string; cached: boolean }> {
  if (!mongoConfigured()) {
    return { ...heuristicLogistics({ name: "Venue", formattedAddress: "", bookingPlatform: "unknown", types: [], externalPlaceId: placeId, provider: "mock", lat: 0, lng: 0, coordsFetchedAt: new Date(), detailsFetchedAt: new Date() } as PlaceRecord), placeId, cached: false };
  }
  const col = await venueLogistics();
  const hit = await col.findOne({ userId, placeId });
  if (hit) {
    return {
      placeId,
      bookingStrategy: hit.bookingStrategy,
      poseDirection: hit.poseDirection,
      optimalSetting: hit.optimalSetting,
      cached: true,
    };
  }

  const place = (await (await places()).findOne(placeLookupFilter(placeId))) as PlaceRecord | null;
  if (!place) {
    return {
      placeId,
      bookingStrategy: "Confirm the venue in your vault, then open the outbound booking link. Aura does not hold tables.",
      poseDirection: "Shoot with available light; keep the frame calm and editorial.",
      optimalSetting: "Party of two, early evening — adjust to your plan dates.",
      cached: false,
    };
  }

  const copy = (await llmLogistics(place)) || heuristicLogistics(place);
  await col.updateOne(
    { userId, placeId },
    {
      $set: {
        userId,
        placeId: placeIdOf(place) || placeId,
        ...copy,
        generatedAt: new Date(),
      },
    },
    { upsert: true },
  );
  return { ...copy, placeId, cached: false };
}
