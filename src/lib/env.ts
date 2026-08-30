export type EnvStatus = {
  mongo: boolean;
  clerk: boolean;
  blob: boolean;
  places: boolean;
  maps: boolean;
  gemini: boolean;
  missing: string[];
};

export function getEnvStatus(): EnvStatus {
  const mongo = Boolean(process.env.MONGODB_URI);
  const clerk = Boolean(
    process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );
  const blob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const places = Boolean(process.env.GOOGLE_PLACES_API_KEY);
  const maps = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  const gemini = Boolean(process.env.GEMINI_API_KEY);
  const missing: string[] = [];
  if (!mongo) missing.push("MONGODB_URI");
  if (!process.env.CLERK_SECRET_KEY) missing.push("CLERK_SECRET_KEY");
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
    missing.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
  if (!blob) missing.push("BLOB_READ_WRITE_TOKEN");
  if (!places) missing.push("GOOGLE_PLACES_API_KEY");
  if (!maps) missing.push("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
  if (!gemini) missing.push("GEMINI_API_KEY");
  return { mongo, clerk, blob, places, maps, gemini, missing };
}

export function clerkConfigured() {
  return Boolean(
    process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );
}
