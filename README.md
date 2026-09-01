# DateDrop

Drop a screenshot. Pick a date. Know if you can go.

Drop screenshots of restaurants and trips. DateDrop figures out where they are, whether your dates actually work, and hands you the booking links.

ReciMe, for places — not a travel super-app.

## Free stack (no Google Places / Maps billing)

| Concern | Service |
| --- | --- |
| Places | **Geoapify** (primary) → **LocationIQ** → public **Nominatim** (1 req/s, cached) |
| Map UI | **MapLibre GL** + **OpenFreeMap** (`styles/dark` or `styles/liberty`) via `react-map-gl` |
| Vision LLM | **Groq** → **OpenRouter** (`google/gemma-4-31b-it:free` → `openrouter/free`) → **Gemini** |
| Auth | Auth.js Google Sign-In (demo-local if OAuth missing) |
| Weather | Open-Meteo archive (free) |
| Database | MongoDB Atlas |

Set `PLACES_PROVIDER=geoapify|locationiq|nominatim` to force a provider. Default picks Geoapify if `GEOAPIFY_API_KEY` is set, else LocationIQ, else Nominatim (no key).

Set `LLM_PROVIDER=auto|gemini|groq|openrouter` (default `auto` = Groq → OpenRouter → Gemini). Prefer working free keys; Gemini keys are often invalid/restricted.

`GOOGLE_PLACES_API_KEY` and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` are optional legacy only — the app boots and maps work without them.

### Attributions

- OpenStreetMap contributors (https://www.openstreetmap.org/copyright)
- Powered by Geoapify when that provider is active
- Map tiles: OpenFreeMap
- Climate: Open-Meteo archive 1991-2020

## What it does

1. Drop screenshots and/or pasted Maps / public venue URLs.
2. Vision LLM extracts visible candidates (JSON).
3. You confirm a place match. Nothing is auto-saved.
4. The place lands on a board grouped by city.
5. Set a date range + party size.
6. Plan: booking-window copy, climate, itinerary.
7. Book on the provider site.

We identify the place and open the booking site.
Rate limit 20/hour.

## Deploy (free, no phone verification)

**GitHub Pages will not work** — this is a Next.js App Router server app (API routes, Auth.js, MongoDB). Static export is not supported.

### Cloudflare Workers (recommended free target)

Uses [@opennextjs/cloudflare](https://opennext.js.org/cloudflare). Local Node build is unchanged (`next build` / `next start` via package scripts).

Scripts: `preview:cf` and `deploy:cf` (OpenNext build + Wrangler). Do **not** deploy until Cloudflare credentials exist (`wrangler` auth). Needs Node 22+ for Wrangler.

Config: `wrangler.toml`, `open-next.config.ts`. Create `.dev.vars` with `NEXTJS_ENV=development` for local Workers preview. Optional R2 incremental cache can be wired later.

### Render (backup, Dockerfile-free)

`render.yaml` is included. Or create a **Web Service** manually with build/start matching the `build` and `start` package scripts. Set the same env vars as `.env.example` in the Render dashboard.

Repo: https://github.com/webby-box/datedrop
