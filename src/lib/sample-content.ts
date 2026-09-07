/** First-run examples — labeled as samples, never mixed into live alerts. */
export const SAMPLE_ALERTS = [
  {
    _id: "sample-maps",
    kind: "example",
    title: "EXAMPLE",
    subtitle: "Google Maps pin",
    placeName: "Google Maps pin",
    body: "Drop a Maps screenshot or paste maps.google.com / maps.app.goo.gl. Confirm the match — Aura never auto-saves a guess.",
    why: "Most viral restaurant saves start as a pin someone sent you.",
    sample: true,
  },
  {
    _id: "sample-ig",
    kind: "example",
    title: "EXAMPLE",
    subtitle: "IG restaurant story",
    placeName: "IG restaurant story",
    body: "Stories hide the name in chrome. Upload the screenshot; vision reads what is visible. We do not scrape Instagram.",
    why: "Stasht/Tote-style save apps win on extraction — screenshot is the honest input.",
    sample: true,
  },
  {
    _id: "sample-trip",
    kind: "example",
    title: "EXAMPLE",
    subtitle: "Travel postcard",
    placeName: "Travel postcard",
    body: "Save the destination, then set plan dates. Climate normals (Open-Meteo 1991–2020) tell you if the season works — not a live forecast scrape.",
    why: "GoPlaces-style trip conversion without pretending we booked the table.",
    sample: true,
  },
] as const;
