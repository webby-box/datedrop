export type CaptureStatus = "processing" | "needs_confirm" | "saved" | "failed";
export type CaptureSource = "upload" | "maps_url" | "booking_url";
export type CandidateKind = "restaurant" | "place" | "destination" | "unknown";
export type SourceHint =
  | "google_maps"
  | "apple_maps"
  | "instagram"
  | "tiktok"
  | "resy"
  | "opentable"
  | "tock"
  | "tripadvisor"
  | "other";
export type BoardPlaceStatus = "want" | "planned" | "booked" | "skipped";
export type BookingPlatform = "resy" | "opentable" | "tock" | "sevenrooms" | "website" | "unknown";
export type ClimateVerdict = "go" | "caution" | "skip";
export type PlacesProvider = "geoapify" | "locationiq" | "nominatim" | "google" | "mock";
export type LlmProvider = "gemini" | "groq" | "auto";

/** Normalized place from any geocoder / places adapter. */
export type NormalizedPlace = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  website?: string;
  phone?: string;
  categories: string[];
  googleMapsUri?: string;
  rating?: number;
  provider: PlacesProvider;
};

export type PlaceMatch = {
  externalPlaceId: string;
  provider: PlacesProvider;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
  googleMapsUri?: string;
  websiteUri?: string;
  phone?: string;
  categories?: string[];
  /** @deprecated use externalPlaceId — kept for client payloads during transition */
  googlePlaceId?: string;
};

export type Candidate = {
  kind: CandidateKind;
  name: string;
  city?: string;
  neighborhood?: string;
  country?: string;
  cues: string[];
  confidence: number;
  sourceHint: SourceHint;
  matches: PlaceMatch[];
};

export type Extraction = {
  summary: string;
  candidates: Candidate[];
};

export type Seasonality = {
  verdict: ClimateVerdict;
  month: number;
  meanMaxC: number;
  meanMinC: number;
  precipMm: number;
  prose: string;
  skipped?: boolean;
  skipReason?: string;
};

export type PlanDay = {
  date: string;
  title: string;
  items: {
    placeId?: string;
    name: string;
    window: string;
    note: string;
    suggested?: boolean;
  }[];
};
