export type EnvStatus = {
  mongo: boolean;
  googleAuth: boolean;
  blob: boolean;
  places: boolean;
  placesProvider: string;
  maps: boolean;
  gemini: boolean;
  groq: boolean;
  llm: boolean;
  llmProvider: string;
  missing: string[];
  optional: string[];
  attribution: string;
};

function placesProvider(): string {
  const forced = (process.env.PLACES_PROVIDER || "").toLowerCase().trim();
  if (forced === "geoapify" || forced === "locationiq" || forced === "nominatim" || forced === "google") {
    return forced;
  }
  if (process.env.MOCK_PLACES === "1") return "mock";
  if (process.env.GEOAPIFY_API_KEY) return "geoapify";
  if (process.env.LOCATIONIQ_API_KEY) return "locationiq";
  if (process.env.GOOGLE_PLACES_API_KEY) return "google";
  return "nominatim";
}

function llmProvider(): string {
  const forced = (process.env.LLM_PROVIDER || "auto").toLowerCase().trim();
  if (forced === "gemini" || forced === "groq" || forced === "auto") return forced;
  return "auto";
}

function placesAttribution(provider: string): string {
  if (provider === "geoapify") return "© OpenStreetMap contributors · Powered by Geoapify";
  if (provider === "locationiq") return "© OpenStreetMap contributors · LocationIQ";
  if (provider === "google") return "Place data © Google · Google Maps Platform";
  if (provider === "mock") return "Mock places (test)";
  return "© OpenStreetMap contributors · Nominatim";
}

export function getEnvStatus(): EnvStatus {
  const mongo = Boolean(process.env.MONGODB_URI);
  const googleAuth = googleAuthConfigured();
  const blob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const provider = placesProvider();
  const places = true;
  const maps = true;
  const gemini = Boolean(process.env.GEMINI_API_KEY);
  const groq = Boolean(process.env.GROQ_API_KEY);
  const llm = gemini || groq || process.env.MOCK_AI === "1";
  const missing: string[] = [];
  const optional: string[] = [];
  if (!mongo) missing.push("MONGODB_URI");
  if (!process.env.AUTH_SECRET) optional.push("AUTH_SECRET");
  if (!process.env.AUTH_GOOGLE_ID) optional.push("AUTH_GOOGLE_ID");
  if (!process.env.AUTH_GOOGLE_SECRET) optional.push("AUTH_GOOGLE_SECRET");
  if (!blob) optional.push("BLOB_READ_WRITE_TOKEN");
  if (!process.env.GEOAPIFY_API_KEY) optional.push("GEOAPIFY_API_KEY");
  if (!process.env.LOCATIONIQ_API_KEY) optional.push("LOCATIONIQ_API_KEY");
  if (!gemini) optional.push("GEMINI_API_KEY");
  if (!groq) optional.push("GROQ_API_KEY");
  if (!llm) missing.push("GEMINI_API_KEY|GROQ_API_KEY");
  if (!process.env.GOOGLE_PLACES_API_KEY) optional.push("GOOGLE_PLACES_API_KEY");
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) optional.push("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
  return {
    mongo,
    googleAuth,
    blob,
    places,
    placesProvider: provider,
    maps,
    gemini,
    groq,
    llm,
    llmProvider: llmProvider(),
    missing,
    optional,
    attribution: placesAttribution(provider),
  };
}

/** True when Google OAuth client credentials are present (demo mode otherwise). */
export function googleAuthConfigured() {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}
