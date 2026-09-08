const KEY = "aura-static-db-v1";
const DEMO_KEY = "aura-demo-session";

export type StaticDb = {
  captures: Record<string, Record<string, unknown>>;
  places: Record<string, Record<string, unknown>>;
  boards: Record<string, Record<string, unknown>>;
  boardPlaces: Record<string, Record<string, unknown>>;
  alerts: Record<string, Record<string, unknown>>;
  taste: string[];
  logistics: Record<string, Record<string, unknown>>;
};

function emptyDb(): StaticDb {
  return {
    captures: {},
    places: {},
    boards: {},
    boardPlaces: {},
    alerts: {},
    taste: ["Manhattan Classics", "Date-night rooms", "Walkable clusters", "Wine-forward"],
    logistics: {},
  };
}

export function isStaticDemo() {
  try {
    return localStorage.getItem(DEMO_KEY) === "1";
  } catch {
    return false;
  }
}

export function setStaticDemo(on: boolean) {
  try {
    if (on) localStorage.setItem(DEMO_KEY, "1");
    else localStorage.removeItem(DEMO_KEY);
  } catch {
    /* ignore */
  }
}

export function loadDb(): StaticDb {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyDb();
    return { ...emptyDb(), ...JSON.parse(raw) };
  } catch {
    return emptyDb();
  }
}

export function saveDb(db: StaticDb) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
