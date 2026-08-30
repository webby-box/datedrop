import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatParty(n: number) {
  return n === 1 ? "1 guest" : `${n} guests`;
}

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function walkingCluster(meters: number) {
  if (meters <= 800) return "walk";
  if (meters <= 2500) return "stroll";
  return "cross-town";
}

export function isoDate(d: Date | string) {
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toISOString().slice(0, 10);
}

export function missingKeysMessage(keys: string[]) {
  if (!keys.length) return null;
  return `Missing environment variables: ${keys.join(", ")}. The app still boots — add them to .env.local when you are ready.`;
}
