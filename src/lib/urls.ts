import type { CaptureSource, SourceHint } from "./types";

export type ParsedPaste = {
  source: CaptureSource;
  sourceHint: SourceHint;
  query: string;
  displayName?: string;
  city?: string;
};

function decodePlus(s: string) {
  return decodeURIComponent(s.replace(/\+/g, " ")).trim();
}

export function classifyUrl(raw: string): ParsedPaste | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  const path = u.pathname + u.search;

  const isGoogleMaps =
    host === "maps.app.goo.gl" ||
    host === "goo.gl" ||
    host === "maps.google.com" ||
    ((host === "google.com" || host.endsWith(".google.com")) && path.includes("/maps"));
  if (isGoogleMaps) {
    const q = u.searchParams.get("q") || u.searchParams.get("query");
    const place = path.match(/\/maps\/place\/([^/]+)/);
    const name = q ? decodePlus(q) : place ? decodePlus(place[1]) : "Google Maps place";
    return { source: "maps_url", sourceHint: "google_maps", query: name, displayName: name };
  }
  if (host.includes("apple.com") && path.includes("maps")) {
    const q = u.searchParams.get("q") || "Apple Maps place";
    return { source: "maps_url", sourceHint: "apple_maps", query: decodePlus(q), displayName: decodePlus(q) };
  }
  if (host.includes("bing.com") && path.includes("maps")) {
    const q = u.searchParams.get("q") || "Bing Maps place";
    return { source: "maps_url", sourceHint: "other", query: decodePlus(q), displayName: decodePlus(q) };
  }
  if (host.includes("resy.com")) {
    const slug = path.split("/").filter(Boolean).pop() || "restaurant";
    const name = decodePlus(slug.replace(/-/g, " "));
    return { source: "booking_url", sourceHint: "resy", query: name, displayName: name };
  }
  if (host.includes("opentable.com")) {
    const r = path.match(/\/r\/([^/?]+)/);
    const name = decodePlus((r?.[1] || "restaurant").replace(/-/g, " "));
    return { source: "booking_url", sourceHint: "opentable", query: name, displayName: name };
  }
  if (host.includes("exploretock.com") || host.includes("tock.com")) {
    const slug = path.split("/").filter(Boolean).pop() || "restaurant";
    const name = decodePlus(slug.replace(/-/g, " "));
    return { source: "booking_url", sourceHint: "tock", query: name, displayName: name };
  }
  if (host.includes("sevenrooms.com")) {
    const slug = path.split("/").filter(Boolean).pop() || "restaurant";
    return { source: "booking_url", sourceHint: "other", query: decodePlus(slug.replace(/-/g, " ")) };
  }
  if (host.includes("instagram.com")) {
    const slug = path.split("/").filter(Boolean).pop() || "instagram";
    return {
      source: "booking_url",
      sourceHint: "instagram",
      query: decodePlus(slug.replace(/[-_]/g, " ")),
      displayName: "Instagram URL — confirm the restaurant (we do not scrape the post)",
    };
  }
  if (host.includes("tiktok.com")) {
    const slug = path.split("/").filter(Boolean).pop() || "tiktok";
    return {
      source: "booking_url",
      sourceHint: "tiktok",
      query: decodePlus(slug.replace(/[-_]/g, " ")),
      displayName: "TikTok URL — confirm the restaurant (we do not scrape the video)",
    };
  }
  if (host.includes("tripadvisor.com")) {
    const slug = path.split("/").filter(Boolean).pop() || "place";
    return {
      source: "booking_url",
      sourceHint: "tripadvisor",
      query: decodePlus(slug.replace(/[-_]/g, " ")),
      displayName: decodePlus(slug.replace(/[-_]/g, " ")),
    };
  }
  return null;
}

export function isSupportedPaste(raw: string) {
  return classifyUrl(raw) !== null;
}
