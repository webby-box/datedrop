# DateDrop

Drop a screenshot. Pick a date. Know if you can go.

Drop screenshots of restaurants and trips. DateDrop figures out where they are, whether your dates actually work, and hands you the booking links.

ReciMe, for places — not a travel super-app.

## What it does

1. Drop 1–N screenshots and/or pasted Maps / public venue URLs.
2. Gemini 2.5 Flash extracts visible candidates (JSON). Maps chrome (red pin, Directions, Save, rating row, bottom-sheet name) is a first-class cue.
3. You confirm a Google Places match. Nothing is auto-saved.
4. The place lands on a board grouped by city.
5. You set a date range + party size.
6. Plan: booking-window copy + outbound deep links, destination climate (go / caution / skip), itinerary from this user's saved places.
7. You book on the provider site.

We identify the place and open the booking site. We don't have live table inventory.

## Capture sources

- Google Maps screenshots (place card, pin, list, share sheet, Street View overlay)
- Apple Maps, Bing Maps
- Instagram / TikTok / Stories / Reels overlays (vision only — we do not scrape those networks)
- Resy, OpenTable, Tock, SevenRooms screens
- Tripadvisor, Infatuation, Eater, Google Search cards
- Destination postcards / city skylines with captions
- Paste-URL proxy: google.com/maps, maps.app.goo.gl, Resy / OpenTable / Tock public venue URLs parsed to Google Places. We do not fetch or scrape live booking slot grids.

## No-scraping rule

- Do not scrape Resy, OpenTable, Tock, Instagram, or TikTok.
- Do not call unofficial reservation APIs. Never api.resy.com.
- Do not book on the user's behalf or show fake time slots.
- Deep links only: Resy date and seats query params, OpenTable /r/{slug} covers and dateTime, Tock search or websiteUri.

## Local setup

Copy .env.example to .env.local. Install dependencies, then run the Next.js dev server (see package.json scripts: dev, build, start, test:e2e).

The app still boots if keys are missing; each feature returns a readable error or a setup message. When Google OAuth env is missing, auth falls back to demo-local mode.

### Environment

- MONGODB_URI — persistence. Database name is always datedrop. Client is cached on globalThis.
- AUTH_SECRET — Auth.js session secret. Generate with `openssl rand -base64 32`.
- AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET — Google OAuth Web Client ID and secret. Auth routes show a setup message if missing; the app still boots in demo-local mode.
- AUTH_URL — optional, e.g. `http://localhost:3000`.
- BLOB_READ_WRITE_TOKEN — private screenshots. Falls back to public/uploads with a warning.
- GOOGLE_PLACES_API_KEY — Places API (New) Text Search, Details, Nearby. Field masks. Store place_id forever. Refetch details older than 7 days.
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY — map pins. Attribution required.
- GEMINI_API_KEY — gemini-2.5-flash vision JSON + itinerary + seasonality prose (not the image-generation model).
- OPENAI_API_KEY — optional.

Rate limit: 20 captures per hour per user.

Climate: Open-Meteo archive 1991-2020, attributed, cached by rounded lat/lng.

### Tests

Playwright happy path. Fixtures:

- fixtures/carbone-placeholder.jpg — synthetic text Carbone / New York / Italian
- fixtures/maps-place-placeholder.jpg — synthetic Maps chrome + a place name

CI mocks Gemini and Places via MOCK_AI=1 and MOCK_PLACES=1.

## Screens

- / landing
- /inbox drop zone (home after login)
- /captures/[id] confirm Google Place
- /boards/[id] dates, map, groups, similar
- /boards/[id]/plan seasonality, open-to-book, itinerary, markdown export
- /places/[id] details + book CTA
- /settings account + delete my data
- /privacy and /terms
- /sign-in Continue with Google (Auth.js)

Repo: https://github.com/webby-box/datedrop
