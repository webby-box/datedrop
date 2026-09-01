# DateDrop

Drop a screenshot. Pick a date. Know if you can go.

Drop screenshots of restaurants and trips. DateDrop figures out where they are, whether your dates actually work, and hands you the booking links.

ReciMe, for places — not a travel super-app.

## Free stack (no Google Places / Maps billing)

| Concern | Service |
| --- | --- |
| Places | **Geoapify** (primary) → **LocationIQ** → public **Nominatim** (1 req/s, cached) |
| Map UI | **MapLibre GL** + **OpenFreeMap** (`styles/dark` or `styles/liberty`) via `react-map-gl` |
| Vision LLM | **Gemini 2.5 Flash** → **Groq** vision (`qwen/qwen3.6-27b`) |
| Auth | Auth.js Google Sign-In (demo-local if OAuth missing) |
| Weather | Open-Meteo archive (free) |
| Database | MongoDB Atlas |

Set `PLACES_PROVIDER=geoapify|locationiq|nominatim` to force a provider. Default picks Geoapify if `GEOAPIFY_API_KEY` is set, else LocationIQ, else Nominatim (no key).

Set `LLM_PROVIDER=gemini|groq|auto` (default `auto` = Gemini then Groq).

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
Repo: https://github.com/webby-box/datedrop
Repo: https://github.com/webby-box/datedrop
