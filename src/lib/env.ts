export type EnvStatus = {
  mongo: boolean;
  googleAuth: boolean;
  blob: boolean;
  places: boolean;
  maps: boolean;
  gemini: boolean;
  missing: string[];
};

export function getEnvStatus(): EnvStatus {
  const mongo = Boolean(process.env.MONGODB_URI);
  const googleAuth = googleAuthConfigured();
  const blob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const places = Boolean(process.env.GOOGLE_PLACES_API_KEY);
  const maps = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  const gemini = Boolean(process.env.GEMINI_API_KEY);
  const missing: string[] = [];
  if (!mongo) missing.push("MONGODB_URI");
  if (!process.env.AUTH_SECRET) missing.push("AUTH_SECRET");
  if (!process.env.AUTH_GOOGLE_ID) missing.push("AUTH_GOOGLE_ID");
  if (!process.env.AUTH_GOOGLE_SECRET) missing.push("AUTH_GOOGLE_SECRET");
  if (!blob) missing.push("BLOB_READ_WRITE_TOKEN");
  if (!places) missing.push("GOOGLE_PLACES_API_KEY");
  if (!maps) missing.push("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
  if (!gemini) missing.push("GEMINI_API_KEY");
  return { mongo, googleAuth, blob, places, maps, gemini, missing };
}

/** True when Google OAuth client credentials are present (demo mode otherwise). */
export function googleAuthConfigured() {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}
