import { loadDb, saveDb, uid, setStaticDemo, isStaticDemo } from "./static-store";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockPlace(name: string, city = "New York") {
  const lilia = /lilia/i.test(name);
  const id = lilia ? "mock-lilia-nyc" : /carbone/i.test(name) ? "mock-carbone-nyc" : `mock-${name.toLowerCase().replace(/\s+/g, "-").slice(0, 24)}`;
  return {
    placeId: id,
    externalPlaceId: id,
    googlePlaceId: id,
    name: lilia ? "Lilia" : /carbone/i.test(name) ? "Carbone" : name || "Carbone",
    formattedAddress: lilia
      ? "567 Union Ave, Brooklyn, NY 11211, USA"
      : "111 Thompson St, New York, NY 10012, USA",
    lat: lilia ? 40.7106 : 40.7279,
    lng: lilia ? -73.9514 : -74.0001,
    rating: 4.6,
    primaryType: "italian_restaurant",
    types: ["italian_restaurant"],
    bookingPlatform: "resy",
    websiteUri: "https://resy.com/cities/ny/carbone",
    googleMapsUri: "https://maps.google.com/?cid=mock",
    provider: "mock",
  };
}

async function readBody(req: Request): Promise<Record<string, unknown>> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await req.json().catch(() => ({}))) as Record<string, unknown>;
  }
  if (ct.includes("form")) {
    const form = await req.formData().catch(() => null);
    if (!form) return {};
    const out: Record<string, unknown> = {};
    form.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }
  const text = await req.text().catch(() => "");
  if (!text) return {};
  try {
    return Object.fromEntries(new URLSearchParams(text));
  } catch {
    return {};
  }
}

function match(path: string, pattern: string) {
  const a = path.split("/").filter(Boolean);
  const b = pattern.split("/").filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < b.length; i++) {
    if (b[i].startsWith(":")) params[b[i].slice(1)] = decodeURIComponent(a[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

export async function handleStaticApi(path: string, req: Request): Promise<Response | null> {
  if (!path.startsWith("/api/")) return null;
  const method = req.method.toUpperCase();
  const db = loadDb();

  if (path === "/api/health" && method === "GET") {
    return json({
      ok: true,
      app: "aura-concierge-elite",
      aka: "datedrop",
      host: "github-pages",
      stack: { places: "mock", maps: "maplibre+openfreemap", llm: "mock", climate: "static-demo", auth: "demo", db: "localStorage" },
      env: { mongo: false, googleAuth: false, llm: true, placesProvider: "mock", missing: [], optional: [] },
      note: "Static GitHub Pages demo. Data stays in this browser. Capture uses a mock match — not live vision.",
    });
  }

  if (path === "/api/auth/csrf" && method === "GET") {
    return json({ csrfToken: "static-demo-csrf" });
  }

  if (path === "/api/auth/session" && method === "GET") {
    if (!isStaticDemo()) return json({});
    return json({
      user: { name: "Aura demo", email: "demo@pages.local", image: null },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
  }

  if (path === "/api/auth/providers" && method === "GET") {
    return json({ demo: { id: "demo", name: "Demo", type: "credentials" } });
  }

  if (path.startsWith("/api/auth/")) {
    const signingOut = /sign-?out/i.test(path);
    if (signingOut) setStaticDemo(false);
    else setStaticDemo(true);
    if (method === "POST") {
      return new Response(null, {
        status: 302,
        headers: { Location: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/` },
      });
    }
    return json({ ok: true, demo: !signingOut });
  }

  if (path === "/api/alerts" && method === "GET") {
    const alerts = Object.values(db.alerts).sort(
      (a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
    );
    return json({ alerts, unread: alerts.filter((a) => !a.read).length, live: alerts.some((a) => !a.read) });
  }

  const alertOne = match(path, "/api/alerts/:id");
  if (alertOne && method === "GET") {
    const alert = db.alerts[alertOne.id];
    if (!alert) return json({ error: "Not found" }, 404);
    alert.read = true;
    saveDb(db);
    const place = alert.placeId ? db.places[String(alert.placeId)] : null;
    return json({
      alert: { ...alert, _id: alertOne.id },
      place: place ? { ...place, id: String(alert.placeId) } : null,
      logistics: alert.placeId ? db.logistics[String(alert.placeId)] : null,
      booking: place
        ? { url: place.websiteUri || "https://resy.com", label: "Open to book on Resy", platform: "resy" }
        : null,
      copy: "Aura identifies the place and opens the booking site. We don't have live table inventory.",
    });
  }

  if (path === "/api/vault" && method === "GET") {
    const url = new URL(req.url, "http://local");
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const city = (url.searchParams.get("city") || "").toLowerCase();
    const occasion = (url.searchParams.get("occasion") || "").toLowerCase();
    const status = (url.searchParams.get("status") || "").toLowerCase();
    const items: Record<string, unknown>[] = [];
    for (const link of Object.values(db.boardPlaces)) {
      const place = db.places[String(link.placeId)];
      const board = db.boards[String(link.boardId)];
      if (!place || !board) continue;
      const row: Record<string, unknown> = {
        ...place,
        placeId: String(place.placeId || link.placeId),
        name: place.name,
        address: place.formattedAddress,
        city: board.city,
        country: board.country,
        boardId: board._id,
        imageUrl: link.sourceScreenshotUrl,
        status: link.status || "want",
        occasion: link.occasion || "want",
        booking: { url: place.websiteUri || "https://resy.com", label: "Open to book on Resy", platform: place.bookingPlatform },
      };
      if (q && !`${row.name} ${row.address} ${row.city}`.toLowerCase().includes(q)) continue;
      if (city && !String(row.city).toLowerCase().includes(city)) continue;
      if (occasion && row.occasion !== occasion) continue;
      if (status && row.status !== status) continue;
      items.push(row);
    }
    return json({ items, cities: [...new Set(items.map((i) => String(i.city || "")))].sort(), similar: [] });
  }

  const vaultOne = match(path, "/api/vault/:id");
  if (vaultOne && method === "GET") {
    const id = decodeURIComponent(vaultOne.id);
    const place = db.places[id];
    if (!place) return json({ error: "Not found" }, 404);
    const links = Object.values(db.boardPlaces).filter((l) => l.placeId === id);
    const board = links[0] ? db.boards[String(links[0].boardId)] : null;
    const logistics = db.logistics[id] || {
      bookingStrategy: "Open Resy 14–30 days out. Aura never holds a table.",
      poseDirection: "Arrive as a guest, not a content shoot — ask for the room, not a selfie wall.",
      optimalSetting: "Weeknight 7:30pm, party of two, bar first if the dining room is slammed.",
    };
    return json({
      place: { ...place, _id: id, placeId: id },
      board,
      boardPlaces: links,
      occasion: links[0]?.occasion || "want",
      status: links[0]?.status || "want",
      imageUrl: links.find((l) => l.sourceScreenshotUrl)?.sourceScreenshotUrl,
      logistics,
      booking: { url: place.websiteUri || "https://resy.com", label: "Open to book on Resy", platform: place.bookingPlatform },
      copy: "Aura identifies the place and opens the booking site. We don't have live table inventory.",
      draftPlan: {
        boardId: board?._id,
        dates: { start: board?.startDate, end: board?.endDate },
        partySize: board?.partySize || 2,
        city: board?.city,
      },
    });
  }
  if (vaultOne && method === "PATCH") {
    const id = decodeURIComponent(vaultOne.id);
    const body = await readBody(req);
    for (const link of Object.values(db.boardPlaces)) {
      if (link.placeId === id) {
        if (typeof body.occasion === "string") link.occasion = body.occasion;
        if (typeof body.status === "string") link.status = body.status;
      }
    }
    saveDb(db);
    return json({ ok: true, ...body });
  }

  if (path === "/api/boards" && method === "GET") {
    const boards = Object.values(db.boards).map((b) => ({
      ...b,
      placeCount: Object.values(db.boardPlaces).filter((l) => l.boardId === b._id).length,
    }));
    return json({ boards });
  }
  if (path === "/api/boards" && method === "POST") {
    const body = await readBody(req);
    const city = String(body.city || "").trim();
    if (!city) return json({ error: "City is required for a plan." }, 400);
    const existing = Object.values(db.boards).find((b) => b.city === city);
    const now = new Date().toISOString();
    if (existing) {
      Object.assign(existing, {
        startDate: body.startDate || existing.startDate,
        endDate: body.endDate || existing.endDate,
        partySize: body.partySize || existing.partySize,
        updatedAt: now,
      });
      saveDb(db);
      return json({ board: existing });
    }
    const id = uid("board");
    const board = {
      _id: id,
      title: String(body.title || city),
      city,
      partySize: Number(body.partySize) || 2,
      startDate: body.startDate,
      endDate: body.endDate || body.startDate,
      createdAt: now,
      updatedAt: now,
    };
    db.boards[id] = board;
    saveDb(db);
    return json({ board });
  }

  const boardOne = match(path, "/api/boards/:id");
  if (boardOne && method === "GET") {
    const board = db.boards[boardOne.id];
    if (!board) return json({ error: "Not found" }, 404);
    const links = Object.values(db.boardPlaces).filter((l) => l.boardId === boardOne.id);
    const places = links.map((l) => db.places[String(l.placeId)]).filter(Boolean);
    return json({ board, places });
  }
  if (boardOne && method === "PATCH") {
    const board = db.boards[boardOne.id];
    if (!board) return json({ error: "Not found" }, 404);
    const body = await readBody(req);
    Object.assign(board, body, { updatedAt: new Date().toISOString() });
    saveDb(db);
    return json({ board });
  }

  const boardPlan = match(path, "/api/boards/:id/plan");
  if (boardPlan && method === "GET") {
    const board = db.boards[boardPlan.id];
    if (!board) return json({ error: "Not found" }, 404);
    return json({
      plan: {
        dates: { start: board.startDate, end: board.endDate },
        partySize: board.partySize || 2,
        seasonality: {
          verdict: "go",
          meanMaxC: 24,
          meanMinC: 16,
          precipMm: 80,
          prose: "Static demo climate: mild evenings. Live Open-Meteo runs on the Node host, not GitHub Pages.",
        },
        days: [
          {
            date: board.startDate || new Date().toISOString().slice(0, 10),
            title: "Evening",
            items: [{ name: "Vault dinner", window: "19:00–21:00", note: "Open the booking site from the vault card." }],
          },
        ],
        bookingCopy: "Open Resy or OpenTable from the vault. Aura does not hold tables.",
      },
    });
  }
  if (boardPlan && method === "POST") {
    return json({ ok: true });
  }

  if (path === "/api/captures" && method === "GET") {
    return json({
      captures: Object.values(db.captures)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .slice(0, 50),
    });
  }
  if (path === "/api/captures" && method === "POST") {
    const body = await readBody(req);
    const id = uid("cap");
    const pastedUrl = String(body.url || "").trim();
    const images = Array.isArray(body.images) ? body.images : [];
    const first = images[0] as { dataBase64?: string; mime?: string } | undefined;
    const blobUrl = first?.dataBase64
      ? `data:${first.mime || "image/jpeg"};base64,${String(first.dataBase64).replace(/^data:[^;]+;base64,/, "")}`
      : undefined;
    const nameHint = pastedUrl || "Carbone";
    const now = new Date().toISOString();
    const placePreview = mockPlace(nameHint.includes("http") ? "Carbone" : nameHint);
    db.captures[id] = {
      _id: id,
      status: "needs_confirm",
      blobUrls: blobUrl ? [blobUrl] : [],
      pastedUrl: pastedUrl || undefined,
      source: pastedUrl ? "maps_url" : "upload",
      createdAt: now,
      updatedAt: now,
      extraction: {
        summary: "GitHub Pages demo — mock match from the filename or URL. Live vision runs on the Node host.",
        candidates: [
          {
            kind: "restaurant",
            name: placePreview.name,
            city: "New York",
            neighborhood: "Manhattan",
            country: "United States",
            cues: ["static demo", pastedUrl ? "pasted URL" : "screenshot"],
            confidence: 0.8,
            sourceHint: "google_maps",
            matches: [
              {
                externalPlaceId: placePreview.placeId,
                googlePlaceId: placePreview.placeId,
                name: placePreview.name,
                formattedAddress: placePreview.formattedAddress,
                rating: placePreview.rating,
                provider: "mock",
              },
            ],
          },
        ],
      },
    };
    saveDb(db);
    return json({ id, status: "needs_confirm", warnings: ["Static GitHub Pages demo uses a mock place match."] });
  }

  const capOne = match(path, "/api/captures/:id");
  if (capOne && method === "GET") {
    const rec = db.captures[capOne.id];
    if (!rec) return json({ error: "Not found" }, 404);
    return json({ capture: rec });
  }

  const capConfirm = match(path, "/api/captures/:id/confirm");
  if (capConfirm && method === "POST") {
    const rec = db.captures[capConfirm.id];
    if (!rec) return json({ error: "Not found" }, 404);
    const body = await readBody(req);
    if (body.action === "search") {
      const q = String(body.query || "Carbone");
      const p = mockPlace(q);
      return json({
        matches: [
          {
            externalPlaceId: p.placeId,
            googlePlaceId: p.placeId,
            name: p.name,
            formattedAddress: p.formattedAddress,
            rating: p.rating,
            provider: "mock",
          },
        ],
      });
    }
    if (body.action === "skip" || body.action === "not_a_place") {
      rec.status = "saved";
      saveDb(db);
      return json({ ok: true, status: "saved" });
    }
    const wanted = String(body.externalPlaceId || body.googlePlaceId || "mock-carbone-nyc");
    const extraction = rec.extraction as { candidates?: { matches?: { name?: string }[] }[] };
    const matchName = extraction?.candidates?.[0]?.matches?.[0]?.name || "Carbone";
    const place = mockPlace(wanted.includes("lilia") ? "Lilia" : matchName);
    db.places[place.placeId] = place;
    let board = Object.values(db.boards).find((b) => b.city === "New York");
    if (!board) {
      const bid = uid("board");
      board = { _id: bid, title: "New York", city: "New York", country: "USA", partySize: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      db.boards[bid] = board;
    }
    const linkId = `${board._id}:${place.placeId}`;
    db.boardPlaces[linkId] = {
      boardId: board._id,
      userId: "demo-local",
      placeId: place.placeId,
      captureId: capConfirm.id,
      sourceScreenshotUrl: Array.isArray(rec.blobUrls) ? rec.blobUrls[0] : undefined,
      status: "want",
      occasion: body.occasion || "want",
      createdAt: new Date().toISOString(),
    };
    rec.status = "saved";
    const aid = uid("alert");
    db.alerts[aid] = {
      _id: aid,
      kind: "rare_finding",
      title: "RARE FINDING",
      subtitle: `${place.name} Reservation`,
      body: `${place.name} is in The Vault. Open the booking site — this Pages demo does not scrape inventory.`,
      placeId: place.placeId,
      boardId: board._id,
      placeName: place.name,
      address: place.formattedAddress,
      why: "Saved from a capture on the static demo.",
      read: false,
      createdAt: new Date().toISOString(),
    };
    saveDb(db);
    return json({ ok: true, boardId: board._id, placeId: place.placeId });
  }

  if (path === "/api/taste" && method === "GET") {
    return json({ profiles: db.taste });
  }
  if (path === "/api/taste" && method === "PUT") {
    const body = await readBody(req);
    db.taste = Array.isArray(body.profiles) ? (body.profiles as string[]).slice(0, 12) : db.taste;
    saveDb(db);
    return json({ profiles: db.taste, persisted: true });
  }

  if (path === "/api/concierge" && method === "POST") {
    const body = await readBody(req);
    const message = String(body.message || "");
    const vaultNames = Object.values(db.places)
      .map((p) => p.name)
      .join(", ");
    return json({
      reply: vaultNames
        ? `From your vault (${vaultNames}): I still will not invent live table times. Open Resy/OpenTable from the vault card. GitHub Pages is a static demo — climate and vision stay mocked.`
        : `I can advise once The Vault has a place. Capture a screenshot first. (Static GitHub Pages demo — ${message.slice(0, 80)})`,
    });
  }

  if (path === "/api/places/search" && method === "GET") {
    const url = new URL(req.url, "http://local");
    const p = mockPlace(url.searchParams.get("q") || "Carbone");
    return json({ results: [p] });
  }

  const placeOne = match(path, "/api/places/:id");
  if (placeOne && method === "GET") {
    const id = decodeURIComponent(placeOne.id);
    const place = db.places[id] || mockPlace(id);
    return json({
      place: { ...place, externalPlaceId: place.placeId, googlePlaceId: place.placeId },
      screenshots: Object.values(db.boardPlaces)
        .filter((l) => l.placeId === id)
        .map((l) => l.sourceScreenshotUrl)
        .filter(Boolean),
      similar: [],
      book: { url: place.websiteUri || "https://resy.com", label: "Open to book on Resy" },
      copy: "Aura identifies the place and opens the booking site. We don't have live table inventory.",
    });
  }

  const logistics = match(path, "/api/logistics/:placeId");
  if (logistics && method === "GET") {
    const id = decodeURIComponent(logistics.placeId);
    return json({
      bookingStrategy: "Open the booking site 14–30 days out. Aura never holds a table.",
      poseDirection: "Keep the phone down until the first course.",
      optimalSetting: "Weeknight, party of two.",
      placeId: id,
    });
  }

  if (path === "/api/settings/delete" && method === "POST") {
    localStorage.removeItem("aura-static-db-v1");
    return json({ ok: true });
  }

  if (isStaticDemo() || path.startsWith("/api/")) {
    return json({ error: "Not found on static demo", path, method }, 404);
  }
  return json({ error: "Not found" }, 404);
}
