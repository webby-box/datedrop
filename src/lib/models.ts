import { ObjectId, type Collection, type OptionalId } from "mongodb";
import { getDb } from "./mongodb";
import type {
  BoardPlaceStatus,
  BookingPlatform,
  PlacesProvider,
  CaptureSource,
  CaptureStatus,
  Extraction,
  PlanDay,
  Seasonality,
} from "./types";

export type UserRecord = {
  _id?: ObjectId;
  userId: string;
  email?: string;
  tasteProfiles?: string[];
  createdAt: Date;
};

export type BoardRecord = {
  _id?: ObjectId;
  userId: string;
  title: string;
  city: string;
  country?: string;
  lat?: number;
  lng?: number;
  startDate?: string;
  endDate?: string;
  partySize: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CaptureRecord = {
  _id?: ObjectId;
  userId: string;
  status: CaptureStatus;
  blobUrls: string[];
  extraction?: Extraction;
  source: CaptureSource;
  pastedUrl?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PlaceRecord = {
  _id?: ObjectId;
  externalPlaceId: string;
  provider: PlacesProvider;
  googlePlaceId?: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  coordsFetchedAt: Date;
  types: string[];
  primaryType?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  reservable?: boolean;
  phone?: string;
  businessStatus?: string;
  bookingPlatform: BookingPlatform;
  detailsFetchedAt: Date;
};

export type BoardPlaceRecord = {
  _id?: ObjectId;
  boardId: string;
  userId: string;
  placeId: string;
  captureId?: string;
  notes?: string;
  sourceScreenshotUrl?: string;
  status: BoardPlaceStatus;
  tasteTags?: string[];
  createdAt: Date;
};

export type PlanRecord = {
  _id?: ObjectId;
  boardId: string;
  userId: string;
  dates: { start: string; end: string };
  partySize: number;
  seasonality: Seasonality;
  days: PlanDay[];
  bookingCopy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AlertKind =
  | "booking_window"
  | "rare_finding"
  | "seasonality"
  | "preference_match";

export type AlertRecord = {
  _id?: ObjectId;
  userId: string;
  kind: AlertKind;
  title: string;
  subtitle: string;
  body: string;
  placeId?: string;
  boardId?: string;
  placeName?: string;
  address?: string;
  imageUrl?: string;
  deepLinkLabel?: string;
  why: string;
  suggestedDates?: { start?: string; end?: string };
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
  fingerprint: string;
};

export type VenueLogisticsRecord = {
  _id?: ObjectId;
  userId: string;
  placeId: string;
  bookingStrategy: string;
  poseDirection: string;
  optimalSetting: string;
  generatedAt: Date;
};

export async function users(): Promise<Collection<OptionalId<UserRecord>>> {
  return (await getDb()).collection("users");
}
export async function boards(): Promise<Collection<OptionalId<BoardRecord>>> {
  return (await getDb()).collection("boards");
}
export async function captures(): Promise<Collection<OptionalId<CaptureRecord>>> {
  return (await getDb()).collection("captures");
}
export async function places(): Promise<Collection<OptionalId<PlaceRecord>>> {
  return (await getDb()).collection("places");
}
export async function boardPlaces(): Promise<Collection<OptionalId<BoardPlaceRecord>>> {
  return (await getDb()).collection("boardPlaces");
}
export async function plans(): Promise<Collection<OptionalId<PlanRecord>>> {
  return (await getDb()).collection("plans");
}
export async function alerts(): Promise<Collection<OptionalId<AlertRecord>>> {
  return (await getDb()).collection("alerts");
}
export async function venueLogistics(): Promise<Collection<OptionalId<VenueLogisticsRecord>>> {
  return (await getDb()).collection("venueLogistics");
}
