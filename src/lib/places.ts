import type { BookingPlatform, PlaceMatch } from "./types";
import type { PlaceRecord } from "./models";
import { places as placesCol } from "./models";

const TEXT_MASK =
  "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.rating,places.userRatingCount,places.googleMapsUri,places.websiteUri,places.priceLevel,places.nationalPhoneNumber,places.businessStatus,places.reservable";

const DETAIL_MASK =
  "id,displayName,formattedAddress,location,types,primaryType,rating,userRatingCount,googleMapsUri,websiteUri,priceLevel,nationalPhoneNumber,businessStatus,reservable";

const NEARBY_MASK =
  "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.rating,places.userRatingCount,places.googleMapsUri";

export class PlacesNotConfigured extends Error {
  constructor() {
    super("GOOGLE_PLACES_API_KEY is not set. Add it to .env.local to resolve Google Places matches.");
    this.name = "PlacesNotConfigured";
  }
}

function key() {
  const k = process.env.GOOGLE_PLACES_API_KEY;
  if (!k) throw new PlacesNotConfigured();
  return k;
}

function mockMatches(query: string): PlaceMatch[] {
  const name = query.split(",")[0]?.trim() || "Carbone";
  return [
    {
      googlePlaceId: "mock-carbone-nyc",
      name: name.includes("Lilia") ? "Lilia" : "Carbone",
      formattedAddress: name.includes("Lilia")
        ? "567 Union Ave, Brooklyn, NY 11211, USA"
        : "111 Thompson St, New York, NY 10012, USA",
      lat: name.includes("Lilia") ? 40.7106 : 40.7279,
      lng: name.includes("Lilia") ? -73.9514 : -74.0001,
      rating: 4.6,
      userRatingCount: 4200,
      primaryType: "italian_restaurant",
      googleMapsUri: "https://maps.google.com/?cid=mock",
      websiteUri: "https://resy.com/cities/ny/carbone",
    },
  ];
}

type GPlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  types?: string[];
  primaryType?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  websiteUri?: string;
  priceLevel?: string;
  nationalPhoneNumber?: string;
  businessStatus?: string;
  reservable?: boolean;
};

function toMatch(p: GPlace): PlaceMatch | null {
  if (!p.id || !p.location?.latitude || !p.location?.longitude) return null;
  return {
    googlePlaceId: p.id,
    name: p.displayName?.text || "Unknown place",
    formattedAddress: p.formattedAddress || "",
    lat: p.location.latitude,
    lng: p.location.longitude,
    rating: p.rating,
    userRatingCount: p.userRatingCount,
    primaryType: p.primaryType,
    googleMapsUri: p.googleMapsUri,
    websiteUri: p.websiteUri,
  };
}

export function inferBookingPlatform(websiteUri?: string, types?: string[]): BookingPlatform {
  const u = (websiteUri || "").toLowerCase();
  if (u.includes("resy.com")) return "resy";
  if (u.includes("opentable.com")) return "opentable";
  if (u.includes("exploretock.com") || u.includes("tock.com")) return "tock";
  if (u.includes("sevenrooms.com")) return "sevenrooms";
  if (websiteUri) return "website";
  if ((types || []).some((t) => t.includes("restaurant"))) return "unknown";
  return "unknown";
}

export async function textSearch(query: string, max = 3): Promise<PlaceMatch[]> {
  if (process.env.MOCK_PLACES === "1") return mockMatches(query).slice(0, max);
  const apiKey = key();
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
    throw new Error(`Places Text Search failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { places?: GPlace[] };
  return (json.places || []).map(toMatch).filter(Boolean) as PlaceMatch[];
}

export async function placeDetails(id: string): Promise<GPlace> {
  if (process.env.MOCK_PLACES === "1") {
    const m = mockMatches("Carbone")[0];
    return {
      id: m.googlePlaceId,
      displayName: { text: m.name },
      formattedAddress: m.formattedAddress,
      location: { latitude: m.lat, longitude: m.lng },
      types: ["restaurant", "italian_restaurant"],
      primaryType: "italian_restaurant",
      rating: m.rating,
      userRatingCount: m.userRatingCount,
      googleMapsUri: m.googleMapsUri,
      websiteUri: m.websiteUri,
      reservable: true,
      businessStatus: "OPERATIONAL",
    };
  }
  const apiKey = key();
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": DETAIL_MASK,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Places Details failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return (await res.json()) as GPlace;
}

export async function nearbyRestaurants(lat: number, lng: number, max = 6): Promise<PlaceMatch[]> {
  if (process.env.MOCK_PLACES === "1") return mockMatches("nearby");
  const apiKey = key();
  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": NEARBY_MASK,
    },
    body: JSON.stringify({
      includedTypes: ["restaurant"],
      maxResultCount: max,
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius: 1200 },
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Places Nearby failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { places?: GPlace[] };
  return (json.places || []).map(toMatch).filter(Boolean) as PlaceMatch[];
}

export async function nearbyAttractions(lat: number, lng: number, max = 2): Promise<PlaceMatch[]> {
  if (process.env.MOCK_PLACES === "1") {
    return [
      {
        googlePlaceId: "mock-attraction",
        name: "Washington Square Park",
        formattedAddress: "Washington Square, New York, NY",
        lat: 40.7308,
        lng: -73.9973,
        primaryType: "tourist_attraction",
      },
    ].slice(0, max);
  }
  const apiKey = key();
  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": NEARBY_MASK,
    },
    body: JSON.stringify({
      includedTypes: ["tourist_attraction"],
      maxResultCount: max,
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius: 4000 },
      },
    }),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { places?: GPlace[] };
  return (json.places || []).map(toMatch).filter(Boolean) as PlaceMatch[];
}

export async function upsertPlaceFromMatch(match: PlaceMatch): Promise<PlaceRecord> {
  const col = await placesCol();
  const existing = await col.findOne({ googlePlaceId: match.googlePlaceId });
  const stale =
    !existing?.detailsFetchedAt ||
    Date.now() - new Date(existing.detailsFetchedAt).getTime() > 7 * 24 * 60 * 60 * 1000;

  let details: GPlace | null = null;
  if (!existing || stale) {
    try {
      details = await placeDetails(match.googlePlaceId);
    } catch {
      details = null;
    }
  }

  const now = new Date();
  const record: PlaceRecord = {
    googlePlaceId: match.googlePlaceId,
    name: details?.displayName?.text || existing?.name || match.name,
    formattedAddress: details?.formattedAddress || existing?.formattedAddress || match.formattedAddress,
    lat: details?.location?.latitude || existing?.lat || match.lat,
    lng: details?.location?.longitude || existing?.lng || match.lng,
    coordsFetchedAt: now,
    types: details?.types || existing?.types || [],
    primaryType: details?.primaryType || existing?.primaryType || match.primaryType,
    websiteUri: details?.websiteUri || existing?.websiteUri || match.websiteUri,
    googleMapsUri: details?.googleMapsUri || existing?.googleMapsUri || match.googleMapsUri,
    rating: details?.rating ?? existing?.rating ?? match.rating,
    userRatingCount: details?.userRatingCount ?? existing?.userRatingCount ?? match.userRatingCount,
    priceLevel: details?.priceLevel || existing?.priceLevel,
    reservable: details?.reservable ?? existing?.reservable,
    phone: details?.nationalPhoneNumber || existing?.phone,
    businessStatus: details?.businessStatus || existing?.businessStatus,
    bookingPlatform: inferBookingPlatform(
      details?.websiteUri || existing?.websiteUri || match.websiteUri,
      details?.types || existing?.types,
    ),
    detailsFetchedAt: details ? now : existing?.detailsFetchedAt || now,
  };

  await col.updateOne(
    { googlePlaceId: match.googlePlaceId },
    { $set: record },
    { upsert: true },
  );
  return record;
}
