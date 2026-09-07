export const PLACE_STATUSES = [
  { id: "want", label: "Want" },
  { id: "planned", label: "Planned" },
  { id: "booked", label: "Booked" },
  { id: "skipped", label: "Skip" },
] as const;

export type PlaceStatusId = (typeof PLACE_STATUSES)[number]["id"];

export function isPlaceStatus(v: string): v is PlaceStatusId {
  return PLACE_STATUSES.some((s) => s.id === v);
}

export function statusLabel(id?: string | null) {
  return PLACE_STATUSES.find((s) => s.id === id)?.label || "Want";
}
