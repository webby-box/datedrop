import type { BookingPlatform, NormalizedPlace, PlaceMatch, PlacesProvider } from "./types";
import type { PlaceRecord } from "./models";
import { places as placesCol } from "./models";

const NOMINATIM_UA = "Aura/1.0 (https://github.com/webby-box/datedrop)";
const NOMINATIM_MIN_INTERVAL_MS = 1100;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export class PlacesNotConfigured extends Error {
  constructor(message?: string) {
    super(
      message ||
        "No places provider available. Set GEOAPIFY_API_KEY, LOCATIONIQ_API_KEY, or rely on Nominatim (no key).",
    );
    this.name = "PlacesNotConfigured";
  }
}

type CacheEntry = { at: number; value: unknown };
const nominatimCache = new Map<string, CacheEntry>();
let nominatimChain: Promise<void> = Promise.resolve();
let lastNominatimAt = 0;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function nominatimFetch(url: string): Promise<unknown> {
  const cached = nominatimCache.get(url);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  const run = nominatimChain.then(async () => {
    const wait = NOMINATIM_MIN_INTERVAL_MS - (Date.now() - lastNominatimAt);
    if (wait > 0) await sleep(wait);
    lastNominatimAt = Date.now();
    const res = await fetch(url, {
      headers: { "User-Agent": NOMINATIM_UA, Accept: "application/json" },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Nominatim failed (${res.status}): ${body.slice(0, 300)}`);
    }
    const json = await res.json();
    nominatimCache.set(url, { at: Date.now(), value: json });
    return json;
  });
  nominatimChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function resolvePlacesProvider(): PlacesProvider {
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

export function placesConfigured(): boolean {
  // Nominatim always works (rate-limited); mock always works.
  return true;
}

export function placesAttribution(provider?: PlacesProvider): string {
  const p = provider || resolvePlacesProvider();
  if (p === "geoapify") return "© OpenStreetMap contributors · Powered by Geoapify";
  if (p === "locationiq") return "© OpenStreetMap contributors · LocationIQ";
  if (p === "google") return "Place data © Google · Google Maps Platform";
  if (p === "mock") return "Mock places (test)";
  return "© OpenStreetMap contributors · Nominatim";
}

function osmMapsUri(lat: number, lng: number, name?: string) {
  const q = name ? encodeURIComponent(name) : `${lat},${lng}`;
  return `https://www.openstreetmap.org/search?query=${q}#map=17/${lat}/${lng}`;
}

function googleMapsSearchUri(lat: number, lng: number, name?: string) {
  const q = encodeURIComponent(name || `${lat},${lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function toPlaceMatch(n: NormalizedPlace): PlaceMatch {
  const primary =
    n.categories.find((c) => /restaurant|cafe|food|bar/i.test(c)) || n.categories[0];
  return {
    externalPlaceId: n.id,
    provider: n.provider,
    name: n.name,
    formattedAddress: n.address,
    lat: n.lat,
    lng: n.lng,
    websiteUri: n.website,
    phone: n.phone,
    categories: n.categories,
    googleMapsUri: n.googleMapsUri || googleMapsSearchUri(n.lat, n.lng, n.name),
    rating: n.rating,
    primaryType: primary?.replace(/\./g, "_"),
    googlePlaceId: n.id, // legacy alias for older clients
  };
}

export function placeIdOf(p: { externalPlaceId?: string; googlePlaceId?: string; id?: string }) {
  return p.externalPlaceId || p.googlePlaceId || p.id || "";
}

export function placeLookupFilter(id: string) {
  return { $or: [{ externalPlaceId: id }, { googlePlaceId: id }] };
}

export function placeIdsLookupFilter(ids: string[]) {
  return { $or: [{ externalPlaceId: { $in: ids } }, { googlePlaceId: { $in: ids } }] };
}

export function inferBookingPlatform(websiteUri?: string, categories?: string[]): BookingPlatform {
  const u = (websiteUri || "").toLowerCase();
  try {
    if (u) {
      const host = new URL(u.startsWith("http") ? u : `https://${u}`).hostname.toLowerCase();
      if (host.includes("resy.com")) return "resy";
      if (host.includes("opentable.com")) return "opentable";
      if (host.includes("exploretock.com") || host.includes("tock.com")) return "tock";
      if (host.includes("sevenrooms.com")) return "sevenrooms";
    }
  } catch {
    /* fall through */
  }
  if (u.includes("resy.com")) return "resy";
  if (u.includes("opentable.com")) return "opentable";
  if (u.includes("exploretock.com") || u.includes("tock.com")) return "tock";
  if (u.includes("sevenrooms.com")) return "sevenrooms";
  if (websiteUri) return "website";
  if ((categories || []).some((t) => /restaurant|cafe|food/i.test(t))) return "unknown";
  return "unknown";
}

function mockNormalized(query: string): NormalizedPlace[] {
  const name = query.split(",")[0]?.trim() || "Carbone";
  const isLilia = /lilia/i.test(name) || /nearby/i.test(query);
  return [
    {
      id: isLilia && !/carbone/i.test(name) ? "mock-lilia-nyc" : "mock-carbone-nyc",
      name: /lilia/i.test(name) ? "Lilia" : /nearby/i.test(query) ? "Carbone" : name.includes("Lilia") ? "Lilia" : "Carbone",
      address: /lilia/i.test(name)
        ? "567 Union Ave, Brooklyn, NY 11211, USA"
        : "111 Thompson St, New York, NY 10012, USA",
      lat: /lilia/i.test(name) ? 40.7106 : 40.7279,
      lng: /lilia/i.test(name) ? -73.9514 : -74.0001,
      website: "https://resy.com/cities/ny/carbone",
      categories: ["catering.restaurant", "italian_restaurant"],
      rating: 4.6,
      provider: "mock",
      googleMapsUri: "https://maps.google.com/?cid=mock",
    },
  ];
}

/* ---------------- Geoapify ---------------- */

async function geoapifySearch(query: string, max: number): Promise<NormalizedPlace[]> {
  const key = process.env.GEOAPIFY_API_KEY!;
  const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query)}&limit=${max}&apiKey=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Geoapify search failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    features?: {
      properties?: {
        place_id?: string | number;
        name?: string;
        formatted?: string;
        address_line1?: string;
        city?: string;
        country?: string;
        lat?: number;
        lon?: number;
        website?: string;
        contact?: { phone?: string };
        categories?: string[];
      };
      geometry?: { coordinates?: [number, number] };
    }[];
  };
  return (json.features || [])
    .map((f) => {
      const p = f.properties || {};
      const lat = p.lat ?? f.geometry?.coordinates?.[1];
      const lng = p.lon ?? f.geometry?.coordinates?.[0];
      const id = p.place_id != null ? String(p.place_id) : "";
      if (!id || lat == null || lng == null) return null;
      const address =
        p.formatted ||
        [p.address_line1, p.city, p.country].filter(Boolean).join(", ") ||
        "";
      return {
        id,
        name: p.name || address.split(",")[0] || "Unknown place",
        address,
        lat,
        lng,
        website: p.website,
        phone: p.contact?.phone,
        categories: p.categories || [],
        provider: "geoapify" as const,
        googleMapsUri: osmMapsUri(lat, lng, p.name),
      } satisfies NormalizedPlace;
    })
    .filter(Boolean) as NormalizedPlace[];
}

async function geoapifyNearby(
  lat: number,
  lng: number,
  max: number,
  categories: string,
): Promise<NormalizedPlace[]> {
  const key = process.env.GEOAPIFY_API_KEY!;
  const url =
    `https://api.geoapify.com/v2/places?categories=${encodeURIComponent(categories)}` +
    `&filter=circle:${lng},${lat},1500&bias=proximity:${lng},${lat}&limit=${max}&apiKey=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Geoapify nearby failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    features?: {
      properties?: {
        place_id?: string | number;
        name?: string;
        formatted?: string;
        address_line1?: string;
        city?: string;
        country?: string;
        lat?: number;
        lon?: number;
        website?: string;
        contact?: { phone?: string };
        categories?: string[];
      };
    }[];
  };
  return (json.features || [])
    .map((f) => {
      const p = f.properties || {};
      const plat = p.lat;
      const plng = p.lon;
      const id = p.place_id != null ? String(p.place_id) : "";
      if (!id || plat == null || plng == null) return null;
      const address =
        p.formatted ||
        [p.address_line1, p.city, p.country].filter(Boolean).join(", ") ||
        "";
      return {
        id,
        name: p.name || address.split(",")[0] || "Unknown place",
        address,
        lat: plat,
        lng: plng,
        website: p.website,
        phone: p.contact?.phone,
        categories: p.categories || [],
        provider: "geoapify" as const,
        googleMapsUri: osmMapsUri(plat, plng, p.name),
      } satisfies NormalizedPlace;
    })
    .filter(Boolean) as NormalizedPlace[];
}

async function geoapifyDetails(id: string): Promise<NormalizedPlace | null> {
  const key = process.env.GEOAPIFY_API_KEY!;
  const url = `https://api.geoapify.com/v2/place-details?id=${encodeURIComponent(id)}&apiKey=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = (await res.json()) as {
    features?: {
      properties?: {
        place_id?: string | number;
        name?: string;
        formatted?: string;
        address_line1?: string;
        city?: string;
        country?: string;
        lat?: number;
        lon?: number;
        website?: string;
        contact?: { phone?: string };
        categories?: string[];
      };
    }[];
  };
  const p = json.features?.[0]?.properties;
  if (!p?.lat || !p?.lon) return null;
  const pid = p.place_id != null ? String(p.place_id) : id;
  const address =
    p.formatted || [p.address_line1, p.city, p.country].filter(Boolean).join(", ") || "";
  return {
    id: pid,
    name: p.name || address.split(",")[0] || "Unknown place",
    address,
    lat: p.lat,
    lng: p.lon,
    website: p.website,
    phone: p.contact?.phone,
    categories: p.categories || [],
    provider: "geoapify",
    googleMapsUri: osmMapsUri(p.lat, p.lon, p.name),
  };
}

/* ---------------- LocationIQ ---------------- */

async function locationiqSearch(query: string, max: number): Promise<NormalizedPlace[]> {
  const key = process.env.LOCATIONIQ_API_KEY!;
  const url =
    `https://us1.locationiq.com/v1/search?key=${encodeURIComponent(key)}` +
    `&q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=${max}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LocationIQ search failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    place_id?: string | number;
    osm_type?: string;
    osm_id?: string | number;
    display_name?: string;
    name?: string;
    lat?: string;
    lon?: string;
    type?: string;
    class?: string;
    namedetails?: { name?: string };
  }[];
  return (Array.isArray(json) ? json : [])
    .map((p) => {
      const lat = Number(p.lat);
      const lng = Number(p.lon);
      const id = p.place_id != null ? `liq-${p.place_id}` : "";
      if (!id || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const name = p.namedetails?.name || p.name || (p.display_name || "").split(",")[0] || "Unknown place";
      return {
        id,
        name,
        address: p.display_name || "",
        lat,
        lng,
        categories: [p.class, p.type].filter(Boolean) as string[],
        provider: "locationiq" as const,
        googleMapsUri: osmMapsUri(lat, lng, name),
      } satisfies NormalizedPlace;
    })
    .filter(Boolean) as NormalizedPlace[];
}

async function locationiqNearby(lat: number, lng: number, max: number, tag: string): Promise<NormalizedPlace[]> {
  const key = process.env.LOCATIONIQ_API_KEY!;
  const url =
    `https://us1.locationiq.com/v1/nearby?key=${encodeURIComponent(key)}` +
    `&lat=${lat}&lon=${lng}&tag=${encodeURIComponent(tag)}&radius=1500&format=json&limit=${max}`;
  const res = await fetch(url);
  if (!res.ok) {
    // Nearby is premium on some plans — soft-fail
    return [];
  }
  const json = (await res.json()) as {
    place_id?: string | number;
    display_name?: string;
    name?: string;
    lat?: string;
    lon?: string;
    type?: string;
    class?: string;
  }[];
  return (Array.isArray(json) ? json : [])
    .map((p) => {
      const plat = Number(p.lat);
      const plng = Number(p.lon);
      const id = p.place_id != null ? `liq-${p.place_id}` : "";
      if (!id || !Number.isFinite(plat) || !Number.isFinite(plng)) return null;
      const name = p.name || (p.display_name || "").split(",")[0] || "Unknown place";
      return {
        id,
        name,
        address: p.display_name || "",
        lat: plat,
        lng: plng,
        categories: [p.class, p.type].filter(Boolean) as string[],
        provider: "locationiq" as const,
        googleMapsUri: osmMapsUri(plat, plng, name),
      } satisfies NormalizedPlace;
    })
    .filter(Boolean) as NormalizedPlace[];
}

/* ---------------- Nominatim ---------------- */

async function nominatimSearch(query: string, max: number): Promise<NormalizedPlace[]> {
  const url =
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}` +
    `&format=json&addressdetails=1&limit=${max}`;
  const json = (await nominatimFetch(url)) as {
    place_id?: number;
    display_name?: string;
    name?: string;
    lat?: string;
    lon?: string;
    type?: string;
    class?: string;
    osm_type?: string;
    osm_id?: number;
  }[];
  return (Array.isArray(json) ? json : [])
    .map((p) => {
      const lat = Number(p.lat);
      const lng = Number(p.lon);
      const id = p.place_id != null ? `osm-${p.place_id}` : "";
      if (!id || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const name = p.name || (p.display_name || "").split(",")[0] || "Unknown place";
      return {
        id,
        name,
        address: p.display_name || "",
        lat,
        lng,
        categories: [p.class, p.type].filter(Boolean) as string[],
        provider: "nominatim" as const,
        googleMapsUri: osmMapsUri(lat, lng, name),
      } satisfies NormalizedPlace;
    })
    .filter(Boolean) as NormalizedPlace[];
}

async function nominatimNearby(lat: number, lng: number, max: number, amenity: string): Promise<NormalizedPlace[]> {
  // Nominatim has no true nearby POI API on the public instance — approximate via reverse + search.
  const q = `${amenity} near ${lat.toFixed(4)},${lng.toFixed(4)}`;
  return nominatimSearch(q, max);
}

/* ---------------- Optional legacy Google ---------------- */

const TEXT_MASK =
  "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.rating,places.userRatingCount,places.googleMapsUri,places.websiteUri,places.nationalPhoneNumber";

async function googleSearch(query: string, max: number): Promise<NormalizedPlace[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY!;
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": TEXT_MASK,
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: max, languageCode: "en" }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Places search failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    places?: {
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
      types?: string[];
      primaryType?: string;
      rating?: number;
      googleMapsUri?: string;
      websiteUri?: string;
      nationalPhoneNumber?: string;
    }[];
  };
  return (json.places || [])
    .map((p) => {
      if (!p.id || p.location?.latitude == null || p.location?.longitude == null) return null;
      return {
        id: p.id,
        name: p.displayName?.text || "Unknown place",
        address: p.formattedAddress || "",
        lat: p.location.latitude,
        lng: p.location.longitude,
        website: p.websiteUri,
        phone: p.nationalPhoneNumber,
        categories: p.types || (p.primaryType ? [p.primaryType] : []),
        rating: p.rating,
        googleMapsUri: p.googleMapsUri,
        provider: "google" as const,
      } satisfies NormalizedPlace;
    })
    .filter(Boolean) as NormalizedPlace[];
}

async function googleNearby(lat: number, lng: number, max: number, type: string): Promise<NormalizedPlace[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY!;
  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.rating,places.googleMapsUri,places.websiteUri",
    },
    body: JSON.stringify({
      includedTypes: [type],
      maxResultCount: max,
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius: 1500 },
      },
    }),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    places?: {
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
      primaryType?: string;
      rating?: number;
      googleMapsUri?: string;
      websiteUri?: string;
    }[];
  };
  return (json.places || [])
    .map((p) => {
      if (!p.id || p.location?.latitude == null || p.location?.longitude == null) return null;
      return {
        id: p.id,
        name: p.displayName?.text || "Unknown place",
        address: p.formattedAddress || "",
        lat: p.location.latitude,
        lng: p.location.longitude,
        website: p.websiteUri,
        categories: p.primaryType ? [p.primaryType] : [],
        rating: p.rating,
        googleMapsUri: p.googleMapsUri,
        provider: "google" as const,
      } satisfies NormalizedPlace;
    })
    .filter(Boolean) as NormalizedPlace[];
}

/* ---------------- Public API ---------------- */

export async function textSearch(query: string, max = 3): Promise<PlaceMatch[]> {
  if (process.env.MOCK_PLACES === "1") {
    return mockNormalized(query).slice(0, max).map(toPlaceMatch);
  }
  const provider = resolvePlacesProvider();
  let rows: NormalizedPlace[] = [];
  if (provider === "geoapify") {
    if (!process.env.GEOAPIFY_API_KEY) throw new PlacesNotConfigured("GEOAPIFY_API_KEY is not set.");
    rows = await geoapifySearch(query, max);
  } else if (provider === "locationiq") {
    if (!process.env.LOCATIONIQ_API_KEY) throw new PlacesNotConfigured("LOCATIONIQ_API_KEY is not set.");
    rows = await locationiqSearch(query, max);
  } else if (provider === "google") {
    if (!process.env.GOOGLE_PLACES_API_KEY) throw new PlacesNotConfigured("GOOGLE_PLACES_API_KEY is not set.");
    rows = await googleSearch(query, max);
  } else {
    rows = await nominatimSearch(query, max);
  }
  return rows.map(toPlaceMatch);
}

export async function nearbyRestaurants(lat: number, lng: number, max = 6): Promise<PlaceMatch[]> {
  if (process.env.MOCK_PLACES === "1") return mockNormalized("nearby").map(toPlaceMatch);
  const provider = resolvePlacesProvider();
  let rows: NormalizedPlace[] = [];
  if (provider === "geoapify") {
    if (!process.env.GEOAPIFY_API_KEY) return [];
    rows = await geoapifyNearby(lat, lng, max, "catering.restaurant,catering.cafe");
  } else if (provider === "locationiq") {
    if (!process.env.LOCATIONIQ_API_KEY) return [];
    rows = await locationiqNearby(lat, lng, max, "restaurant");
  } else if (provider === "google") {
    if (!process.env.GOOGLE_PLACES_API_KEY) return [];
    rows = await googleNearby(lat, lng, max, "restaurant");
  } else {
    rows = await nominatimNearby(lat, lng, max, "restaurant");
  }
  return rows.map(toPlaceMatch);
}

export async function nearbyAttractions(lat: number, lng: number, max = 2): Promise<PlaceMatch[]> {
  if (process.env.MOCK_PLACES === "1") {
    return [
      toPlaceMatch({
        id: "mock-attraction",
        name: "Washington Square Park",
        address: "Washington Square, New York, NY",
        lat: 40.7308,
        lng: -73.9973,
        categories: ["tourism.attraction", "tourist_attraction"],
        provider: "mock",
      }),
    ].slice(0, max);
  }
  const provider = resolvePlacesProvider();
  let rows: NormalizedPlace[] = [];
  try {
    if (provider === "geoapify" && process.env.GEOAPIFY_API_KEY) {
      rows = await geoapifyNearby(lat, lng, max, "tourism.attraction,entertainment");
    } else if (provider === "locationiq" && process.env.LOCATIONIQ_API_KEY) {
      rows = await locationiqNearby(lat, lng, max, "tourism");
    } else if (provider === "google" && process.env.GOOGLE_PLACES_API_KEY) {
      rows = await googleNearby(lat, lng, max, "tourist_attraction");
    } else {
      rows = await nominatimNearby(lat, lng, max, "attraction");
    }
  } catch {
    rows = [];
  }
  return rows.map(toPlaceMatch);
}

async function refreshDetails(match: PlaceMatch): Promise<NormalizedPlace | null> {
  const provider = match.provider || resolvePlacesProvider();
  try {
    if (provider === "geoapify" && process.env.GEOAPIFY_API_KEY) {
      return await geoapifyDetails(match.externalPlaceId);
    }
    // LocationIQ / Nominatim / Google: re-search by id/name is enough; skip paid detail calls.
    return {
      id: match.externalPlaceId,
      name: match.name,
      address: match.formattedAddress,
      lat: match.lat,
      lng: match.lng,
      website: match.websiteUri,
      phone: match.phone,
      categories: match.categories || (match.primaryType ? [match.primaryType] : []),
      googleMapsUri: match.googleMapsUri,
      rating: match.rating,
      provider,
    };
  } catch {
    return null;
  }
}

export async function upsertPlaceFromMatch(match: PlaceMatch): Promise<PlaceRecord> {
  const col = await placesCol();
  const id = placeIdOf(match);
  const existing = await col.findOne(placeLookupFilter(id));
  const stale =
    !existing?.detailsFetchedAt ||
    Date.now() - new Date(existing.detailsFetchedAt).getTime() > 7 * 24 * 60 * 60 * 1000;

  let details: NormalizedPlace | null = null;
  if (!existing || stale) {
    details = await refreshDetails(match);
  }

  const now = new Date();
  const categories =
    details?.categories || existing?.types || match.categories || (match.primaryType ? [match.primaryType] : []);
  const website = details?.website || existing?.websiteUri || match.websiteUri;
  const record: PlaceRecord = {
    externalPlaceId: id,
    provider: details?.provider || match.provider || resolvePlacesProvider(),
    ...(existing?.googlePlaceId ? { googlePlaceId: existing.googlePlaceId } : {}),
    name: details?.name || existing?.name || match.name,
    formattedAddress: details?.address || existing?.formattedAddress || match.formattedAddress,
    lat: details?.lat ?? existing?.lat ?? match.lat,
    lng: details?.lng ?? existing?.lng ?? match.lng,
    coordsFetchedAt: now,
    types: categories,
    primaryType:
      match.primaryType ||
      existing?.primaryType ||
      categories.find((c) => /restaurant|cafe|food/i.test(c)) ||
      categories[0],
    websiteUri: website,
    googleMapsUri: details?.googleMapsUri || existing?.googleMapsUri || match.googleMapsUri,
    rating: details?.rating ?? existing?.rating ?? match.rating,
    userRatingCount: existing?.userRatingCount ?? match.userRatingCount,
    priceLevel: existing?.priceLevel,
    reservable: existing?.reservable,
    phone: details?.phone || existing?.phone || match.phone,
    businessStatus: existing?.businessStatus,
    bookingPlatform: inferBookingPlatform(website, categories),
    detailsFetchedAt: details ? now : existing?.detailsFetchedAt || now,
  };

  await col.updateOne(placeLookupFilter(id), { $set: record }, { upsert: true });
  return record;
}
