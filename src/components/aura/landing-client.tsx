"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";

const STEPS = [
  {
    n: "01",
    title: "Drop",
    body: "Screenshot a Maps pin, IG story, TikTok, or booking app — or paste a public Maps / Resy / OpenTable URL.",
  },
  {
    n: "02",
    title: "Confirm",
    body: "Aura reads visible chrome and asks you to pick the place. We never auto-save a guess.",
  },
  {
    n: "03",
    title: "Date",
    body: "Tag an occasion, set city dates, get climate + booking-window alerts, then open the real booking site.",
  },
];

const EXAMPLES = [
  { kicker: "Capture", title: "Google Maps pin", body: "Paste maps.google.com or drop the pin screenshot." },
  { kicker: "Capture", title: "IG restaurant story", body: "Stories hide names. Upload the shot — we do not scrape Instagram." },
  { kicker: "Plan", title: "Travel postcard", body: "Vault the destination, then check season with Open-Meteo normals." },
];

export function LandingClient({ authReady }: { authReady: boolean }) {
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  async function demo() {
    setBusy(true);
    try {
      const csrfRes = await fetch("/api/auth/csrf");
      const csrf = await csrfRes.json();
      const token = csrf?.csrfToken;
      if (!token) {
        await signIn("demo", { callbackUrl: "/", redirect: true });
        return;
      }
      await fetch("/api/auth/callback/demo", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ csrfToken: token, callbackUrl: "/" }),
        redirect: "manual",
      });
      window.location.assign("/");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <SiteHeader authReady={authReady} />
      <main>
        <section className="relative overflow-hidden bg-[var(--header)] text-[#f7f2e9]">
          <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
            <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-[var(--gold)]/20 blur-3xl" />
            <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-[var(--gold)]/10 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 md:px-6 md:pb-24 md:pt-20">
            <p className="kicker !text-[var(--gold)]">Aura Concierge Elite · formerly DateDrop</p>
            <h1 className="page-title serif mt-5 max-w-3xl text-5xl text-[#f7f2e9] md:text-7xl">
              Drop a screenshot.
              <span className="serif-italic mt-2 block text-[var(--gold)]">Leave with a plan.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[#f7f2e9]/72">
              Screenshots of restaurants and trips pile up and never become dinner. Aura turns them into a
              private vault, climate-aware dates, and outbound booking links. We don&apos;t have live table
              inventory — and we don&apos;t scrape Resy.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void demo()}
                disabled={busy || !ready}
                className="focus-ring inline-flex min-h-[48px] items-center rounded-full bg-[var(--gold)] px-6 text-sm font-medium text-[var(--ink)] transition hover:bg-[#c9a97a] disabled:opacity-60"
              >
                {busy ? "Entering…" : "Continue as demo"}
              </button>
              <Link
                href="/sign-in"
                className="focus-ring inline-flex min-h-[48px] items-center rounded-full border border-white/20 px-6 text-sm text-[#f7f2e9] transition hover:border-[var(--gold)]/50"
              >
                Sign in
              </Link>
              <Link
                href="/capture"
                className="focus-ring inline-flex min-h-[48px] items-center px-2 text-sm text-[#f7f2e9]/70 underline-offset-4 hover:text-[var(--gold)] hover:underline"
              >
                Skip to Capture
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--line)] bg-[var(--bg-elevated)]/80">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3 md:px-6 md:py-16">
            {STEPS.map((s) => (
              <div key={s.title}>
                <p className="kicker">
                  {s.n} · {s.title}
                </p>
                <h2 className="serif-italic mt-3 text-3xl">{s.title}</h2>
                <p className="page-lead mt-3">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
          <p className="kicker">Built for how people actually save</p>
          <h2 className="serif mt-3 max-w-2xl text-3xl md:text-4xl">
            Not a generic stash app. Not a Dorsia-style access club.
          </h2>
          <p className="page-lead mt-4 max-w-2xl">
            Save-to-map apps stop at pins. Luxury booking apps sell tables. Aura sits in the conversion
            gap: confirm the place, tag the occasion, plan the dates, open the booking site when the
            window is real.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {EXAMPLES.map((ex) => (
              <article key={ex.title} className="card-light rounded-[var(--radius-xl)] p-6">
                <p className="kicker">{ex.kicker}</p>
                <h3 className="serif-italic mt-2 text-2xl">{ex.title}</h3>
                <p className="page-lead mt-2">{ex.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
          <div className="card-dark rounded-[var(--radius-2xl)] px-6 py-10 md:px-12 md:py-14">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--gold)]">Honest product</p>
            <h2 className="serif-italic mt-3 text-3xl text-[#f7f2e9] md:text-4xl">We identify. You book.</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#f7f2e9]/70">
              No fake time slots. No api.resy.com. No payments. Camera and paste work on mobile — that is
              where the screenshots live.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/capture"
                className="focus-ring inline-flex min-h-[48px] items-center rounded-full bg-[var(--gold)] px-6 text-sm font-medium text-[var(--ink)]"
              >
                Drop a screenshot
              </Link>
              <Link href="/privacy" className="inline-flex min-h-[48px] items-center text-sm text-[#f7f2e9]/60 hover:text-[#f7f2e9]">
                Privacy
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
