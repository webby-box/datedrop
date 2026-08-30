import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { clerkConfigured } from "@/lib/env";

const STEPS = [
  { n: "01", title: "Drop", body: "Screenshots of Maps pins, IG stories, Resy screens, postcards — or paste a Maps URL." },
  { n: "02", title: "Confirm", body: "Gemini reads the chrome. You pick the Google Place. We never auto-save a guess." },
  { n: "03", title: "Date", body: "Set a range. See booking-window copy, climate, and an itinerary from your saved places." },
];

const EXAMPLES = [
  { tag: "Google Maps pin", title: "The red pin knows", body: "Place card, Directions, rating row, bottom-sheet name — we treat Maps chrome as a cue, not noise." },
  { tag: "IG restaurant story", title: "Story overlay", body: "Username, location sticker, the plate. We extract what's visible — we don't scrape Instagram." },
  { tag: "Travel postcard", title: "A skyline with a caption", body: "City, country, a weekend. Destination boards get climate. Restaurant boards skip it." },
];

export default function LandingPage() {
  const href = clerkConfigured() ? "/sign-in" : "/inbox";
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pb-24">
        <section className="grid gap-12 py-16 md:grid-cols-[1.2fr_0.8fr] md:py-24">
          <div>
            <p className="kicker">ReciMe, for places</p>
            <h1 className="serif mt-4 text-5xl leading-[0.95] tracking-tight md:text-7xl">
              Drop a screenshot.
              <br />
              Pick a date.
              <br />
              Know if you can go.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[#cfc3ae]">
              Drop screenshots of restaurants and trips. DateDrop figures out where they are,
              whether your dates actually work, and hands you the booking links.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={href}
                className="rounded-full bg-[#c45c26] px-6 py-3 text-sm font-medium text-[#f4ead5]"
              >
                Sign in
              </Link>
              <Link
                href="/inbox"
                className="rounded-full border border-[rgba(244,234,213,0.18)] px-6 py-3 text-sm"
              >
                Open inbox
              </Link>
            </div>
            <p className="mt-4 max-w-md text-xs text-[#9a8f7e]">
              We identify the place and open the booking site. We don&apos;t have live table
              inventory. We do not scrape Resy or OpenTable. We never call api.resy.com.
            </p>
          </div>
          <div className="grid gap-4">
            {EXAMPLES.map((ex) => (
              <article key={ex.tag} className="polaroid">
                <div className="flex h-28 items-end bg-gradient-to-br from-[#2a2218] to-[#12100c] p-4">
                  <span className="kicker">{ex.tag}</span>
                </div>
                <h3 className="serif mt-3 text-xl">{ex.title}</h3>
                <p className="mt-1 text-sm text-[#9a8f7e]">{ex.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 border-t border-[rgba(244,234,213,0.08)] py-16 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n}>
              <p className="kicker">{s.n}</p>
              <h2 className="serif mt-2 text-3xl">{s.title}</h2>
              <p className="mt-2 text-[#cfc3ae]">{s.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
