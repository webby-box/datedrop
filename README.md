# Aura Concierge Elite

Luxury travel and dining conversion layer (formerly DateDrop). Capture screenshots into The Vault, tag an occasion, receive booking-window alerts, and open outbound booking links. No live table inventory. No Resy/OpenTable scraping.

Live: https://datedrop.onrender.com

## Market position (validated 2026)

Two crowded categories exist:

1. **Save-to-map** — Stasht, Tote, GoPlaces, Rezz, Drawer, Rodeo turn IG/TikTok/screenshots into pins.
2. **Access concierge** — Dorsia, HotSpot, FineDiningTable sell or broker hard tables via restaurant relationships or prepaid spend.

Aura does not compete on access. The job to be done is: *screenshots of restaurants and trips never become a bookable night*. Drop → Confirm → Date is the loop. Climate (Open-Meteo normals) and 14–30 day booking-window alerts are the differentiators save-apps skip, without pretending we hold inventory.

## Routes

- `/` Public landing (Explore when signed in)
- `/explore` Redirects to `/`
- `/vault` Saved places, city + occasion filters
- `/capture` Screenshot / camera / URL capture
- `/plans` Date ranges, party size, itinerary
- `/premium` Membership (complimentary — no payments)
- `/alerts/[id]` Logistics + draft plan
- `/concierge` Aura AI chat
- `/captures/[id]` Confirm place match + occasion
- `/inbox` Redirects to `/capture`

## Stack

Geoapify/LocationIQ/Nominatim, MapLibre+OpenFreeMap, Groq/OpenRouter/Gemini, Auth.js Google (+ demo), Open-Meteo, MongoDB.

Booking = outbound links only. Env vars: `.env.example`.

Deploy via Render (`render.yaml`) on push to `main`.
