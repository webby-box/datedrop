import type { Candidate, Extraction, LlmProvider, SourceHint } from "./types";

const GEMINI_MODEL = "gemini-2.5-flash";
const GROQ_VISION_MODEL = process.env.GROQ_VISION_MODEL || "qwen/qwen3.6-27b";
const OPENROUTER_VISION_MODEL =
  process.env.OPENROUTER_VISION_MODEL || "google/gemma-4-31b-it:free";
const OPENROUTER_FALLBACK_MODEL = "openrouter/free";

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
      ? "Maps place card with a named restaurant in New York."
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

export function resolveLlmProvider(): LlmProvider {
  const forced = (process.env.LLM_PROVIDER || "auto").toLowerCase().trim();
  if (forced === "gemini" || forced === "groq" || forced === "openrouter" || forced === "auto") {
    return forced;
  }
  return "auto";
}

export function llmConfigured(): boolean {
  return Boolean(
    process.env.GEMINI_API_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.MOCK_AI === "1",
  );
}

async function extractWithGemini(images: { mime: string; bytes: Buffer }[]): Promise<Extraction> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set.");
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
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
  return parseJson(result.response.text());
}

async function extractWithGroq(images: { mime: string; bytes: Buffer }[]): Promise<Extraction> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set.");
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [
    {
      type: "text",
      text:
        SYSTEM +
        "\n\nExtract every distinct place visible in these screenshots. Maps chrome (pin, Directions, Save, rating row, bottom sheet) is a strong cue. Respond with JSON only.",
    },
    ...images.map((img) => ({
      type: "image_url" as const,
      image_url: {
        url: `data:${img.mime};base64,${img.bytes.toString("base64")}`,
      },
    })),
  ];
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      reasoning_format: "parsed",
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq vision failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = json.choices?.[0]?.message?.content || "";
  return parseJson(text);
}

async function openRouterChat(
  key: string,
  model: string,
  content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  >,
  temperature: number,
  jsonMode: boolean,
): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    temperature,
    messages: [{ role: "user", content }],
  };
  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.AUTH_URL || "https://datedrop.app",
      "X-Title": "DateDrop",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`OpenRouter failed (${res.status}, model=${model}): ${errBody.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content || "";
}

async function extractWithOpenRouter(
  images: { mime: string; bytes: Buffer }[],
): Promise<Extraction> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set.");
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [
    {
      type: "text",
      text:
        SYSTEM +
        "\n\nExtract every distinct place visible in these screenshots. Maps chrome (pin, Directions, Save, rating row, bottom sheet) is a strong cue. Respond with JSON only.",
    },
    ...images.map((img) => ({
      type: "image_url" as const,
      image_url: {
        url: `data:${img.mime};base64,${img.bytes.toString("base64")}`,
      },
    })),
  ];
  const models = [OPENROUTER_VISION_MODEL, OPENROUTER_FALLBACK_MODEL].filter(
    (m, i, arr) => arr.indexOf(m) === i,
  );
  const errors: string[] = [];
  for (const model of models) {
    try {
      const text = await openRouterChat(key, model, content, 0.2, true);
      return parseJson(text);
    } catch (err) {
      errors.push((err as Error).message);
    }
  }
  throw new Error(errors.join(" | "));
}

export async function extractFromImages(
  images: { mime: string; bytes: Buffer }[],
): Promise<Extraction> {
  if (process.env.MOCK_AI === "1") return mockExtraction("maps");
  const mode = resolveLlmProvider();
  const errors: string[] = [];

  // auto order: groq → openrouter → gemini (prefer working free keys; gemini may be invalid)
  const order: Array<"groq" | "openrouter" | "gemini"> =
    mode === "auto"
      ? ["groq", "openrouter", "gemini"]
      : mode === "groq"
        ? ["groq"]
        : mode === "openrouter"
          ? ["openrouter"]
          : ["gemini"];

  for (const provider of order) {
    if (provider === "groq") {
      if (!process.env.GROQ_API_KEY) {
        if (mode === "groq") {
          throw new Error(
            "GROQ_API_KEY is not set. Add it to .env.local or set LLM_PROVIDER=openrouter|gemini.",
          );
        }
        continue;
      }
      try {
        return await extractWithGroq(images);
      } catch (err) {
        errors.push(`Groq: ${(err as Error).message}`);
        if (mode === "groq") throw err;
      }
    } else if (provider === "openrouter") {
      if (!process.env.OPENROUTER_API_KEY) {
        if (mode === "openrouter") {
          throw new Error(
            "OPENROUTER_API_KEY is not set. Add it to .env.local or set LLM_PROVIDER=groq|gemini.",
          );
        }
        continue;
      }
      try {
        return await extractWithOpenRouter(images);
      } catch (err) {
        errors.push(`OpenRouter: ${(err as Error).message}`);
        if (mode === "openrouter") throw err;
      }
    } else if (provider === "gemini") {
      if (!process.env.GEMINI_API_KEY) {
        if (mode === "gemini") {
          throw new Error(
            "GEMINI_API_KEY is not set. Add it to .env.local or set LLM_PROVIDER=groq|openrouter.",
          );
        }
        continue;
      }
      try {
        return await extractWithGemini(images);
      } catch (err) {
        errors.push(`Gemini: ${(err as Error).message}`);
        if (mode === "gemini") throw err;
      }
    }
  }

  throw new Error(
    errors.length
      ? `Vision LLM failed. ${errors.join(" | ")}`
      : "No vision LLM configured. Set GROQ_API_KEY, OPENROUTER_API_KEY, or GEMINI_API_KEY.",
  );
}

async function geminiText(prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: { temperature: 0.4 },
    });
    const result = await model.generateContent(prompt);
    return result.response.text().trim() || null;
  } catch {
    return null;
  }
}

async function groqText(prompt: string): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        temperature: 0.4,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return json.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

async function openRouterText(prompt: string): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  const models = [OPENROUTER_VISION_MODEL, OPENROUTER_FALLBACK_MODEL].filter(
    (m, i, arr) => arr.indexOf(m) === i,
  );
  for (const model of models) {
    try {
      const text = await openRouterChat(
        key,
        model,
        [{ type: "text", text: prompt }],
        0.4,
        false,
      );
      const trimmed = text.trim();
      if (trimmed) return trimmed;
    } catch {
      // try next model
    }
  }
  return null;
}

async function proseWithFallback(prompt: string, fallback: string): Promise<string> {
  if (process.env.MOCK_AI === "1") return fallback;
  const mode = resolveLlmProvider();
  const order: Array<"groq" | "openrouter" | "gemini"> =
    mode === "auto"
      ? ["groq", "openrouter", "gemini"]
      : mode === "groq"
        ? ["groq"]
        : mode === "openrouter"
          ? ["openrouter"]
          : ["gemini"];

  for (const provider of order) {
    if (provider === "groq") {
      const q = await groqText(prompt);
      if (q) return q;
    } else if (provider === "openrouter") {
      const o = await openRouterText(prompt);
      if (o) return o;
    } else if (provider === "gemini") {
      const g = await geminiText(prompt);
      if (g) return g;
    }
  }
  return fallback;
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
  return proseWithFallback(
    `Write 2 short sentences of travel-seasonality copy. Use ONLY these numbers, do not invent weather: city=${input.city}, month=${input.monthName}, meanMaxC=${input.meanMaxC}, meanMinC=${input.meanMinC}, precipMm=${input.precipMm}, verdict=${input.verdict}. No packing lists. No flights.`,
    fallback,
  );
}

export async function writeItineraryProse(input: {
  city: string;
  dates: string;
  partySize: number;
  places: { name: string; neighborhood?: string }[];
}): Promise<string> {
  const names = input.places.map((p) => p.name).join(", ");
  const fallback = `${input.city} · ${input.dates} · party of ${input.partySize}. Cluster ${names} by walking distance. Book on the provider sites — DateDrop does not hold tables.`;
  return proseWithFallback(
    `One paragraph itinerary intro for a date-night / trip board. City ${input.city}, ${input.dates}, party of ${input.partySize}. Places (from THIS user's screenshots only): ${names}. Do not add famous restaurants they did not save. Mention they book on Resy/OpenTable/Tock themselves.`,
    fallback,
  );
}
