# Aura Concierge Elite

Luxury travel and dining concierge (formerly DateDrop). Capture screenshots into The Vault, receive proactive alerts, compose booking strategy / pose direction / optimal setting, and plan with climate without scraping live table inventory.

Live: https://datedrop.onrender.com

## Routes

- `/` Landing (redirects to Explore when signed in)
- `/explore` Proactive alerts, vault map, taste profiles
- `/vault` Saved places with logistics panels
- `/capture` Screenshot/URL capture to vault
- `/plans` Date ranges, party size, itinerary export
- `/premium` Membership polish (no payments)
- `/alerts/[id]` Logistics detail + Draft Plan
- `/concierge` Aura AI chat
- `/captures/[id]` Confirm place match
- `/boards/[id]/plan` Climate + itinerary

## Stack

Geoapify/LocationIQ/Nominatim, MapLibre+OpenFreeMap, Groq/OpenRouter/Gemini, Auth.js Google, Open-Meteo, MongoDB.

No Resy/OpenTable scraping. Booking = outbound links only. Env vars: see .env.example.

Deploy via Render (render.yaml) on push to main.
