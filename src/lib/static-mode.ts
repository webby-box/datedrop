export const isStaticApp = process.env.NEXT_PUBLIC_STATIC === "1";
export const appBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const STATIC_ID_PARAMS = [{ id: "_" }];

export function homeAssignPath() {
  return `${appBasePath}/`;
}

export function captureHref(id: string) {
  return isStaticApp ? `/captures/_?id=${encodeURIComponent(id)}` : `/captures/${encodeURIComponent(id)}`;
}

export function vaultHref(id: string) {
  return isStaticApp ? `/vault/_?id=${encodeURIComponent(id)}` : `/vault/${encodeURIComponent(id)}`;
}

export function planHref(id: string) {
  return isStaticApp ? `/plans/_?id=${encodeURIComponent(id)}` : `/plans/${id}`;
}

export function alertHref(id: string) {
  return isStaticApp ? `/alerts/_?id=${encodeURIComponent(id)}` : `/alerts/${id}`;
}

export function boardHref(id: string) {
  return isStaticApp ? `/boards/_?id=${encodeURIComponent(id)}` : `/boards/${id}`;
}

export function boardPlanHref(id: string) {
  return isStaticApp ? `/boards/_/plan?id=${encodeURIComponent(id)}` : `/boards/${id}/plan`;
}

export function placeHref(id: string) {
  return isStaticApp ? `/places/_?id=${encodeURIComponent(id)}` : `/places/${encodeURIComponent(id)}`;
}
