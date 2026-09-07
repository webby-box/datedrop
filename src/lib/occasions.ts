export const OCCASIONS = [
  { id: "date-night", label: "Date night" },
  { id: "trip", label: "Trip" },
  { id: "brunch", label: "Brunch" },
  { id: "group", label: "Group" },
  { id: "solo", label: "Solo" },
  { id: "want", label: "Want to go" },
] as const;

export type OccasionId = (typeof OCCASIONS)[number]["id"];

export function occasionLabel(id?: string | null) {
  return OCCASIONS.find((o) => o.id === id)?.label || null;
}

export function isOccasionId(v: string): v is OccasionId {
  return OCCASIONS.some((o) => o.id === v);
}
