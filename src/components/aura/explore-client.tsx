"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "./app-shell";
import { AlertCard, type AlertCardData } from "./alert-card";
import { TasteChips } from "./taste-chips";
import { EmptyState } from "./empty-state";
import { CardSkeleton } from "./skeleton";
import { BoardMap } from "@/components/board-map";
import { SAMPLE_ALERTS } from "@/lib/sample-content";

type VaultPin = { lat: number; lng: number; name: string; placeId: string };

export function ExploreClient() {
  const [alerts, setAlerts] = useState<AlertCardData[]>([]);
  const [live, setLive] = useState(false);
  const [pins, setPins] = useState<VaultPin[]>([]);
  const [vaultCount, setVaultCount] = useState(0);
  const [planCount, setPlanCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [aRes, vRes, bRes] = await Promise.all([
          fetch("/api/alerts"),
          fetch("/api/vault"),
          fetch("/api/boards"),
        ]);
        const aJson = await aRes.json();
        const vJson = await vRes.json();
        const bJson = await bRes.json();
        if (aRes.ok) {
          setAlerts(aJson.alerts || []);
          setLive(Boolean(aJson.live));
        }
        if (vRes.ok) {
          const items = vJson.items || [];
          setVaultCount(items.length);
          setPins(
            items
              .filter((i: VaultPin) => i.lat && i.lng)
              .map((i: VaultPin & { name: string }) => ({
                lat: i.lat,
                lng: i.lng,
                name: i.name,
                placeId: i.placeId,
              })),
          );
        }
        if (bRes.ok) setPlanCount((bJson.boards || []).length);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const next = useMemo(() => {
    if (!vaultCount) {
      return {
        kicker: "Start here",
        title: "Capture the first pin",
        body: "Drop a Maps screenshot or paste a URL. Confirm before Aura saves it.",
        href: "/capture",
        cta: "Open Capture",
      };
    }
    if (!planCount) {
      return {
        kicker: "Next",
        title: "Put dates on a city",
        body: "A plan unlocks climate notes and booking-window alerts from your vault.",
        href: "/plans",
        cta: "Create a plan",
      };
    }
    return {
      kicker: "Tonight",
      title: "Ask Aura or open a booking site",
      body: "Logistics stay in the vault. Tables stay on Resy / OpenTable — we never invent slots.",
      href: "/concierge",
      cta: "Ask Aura",
    };
  }, [vaultCount, planCount]);

  return (
    <AppShell live={live}>
      <div className="py-6 md:py-10">
        <div className="card-dark overflow-hidden rounded-[var(--radius-2xl)] px-5 py-7 md:px-8 md:py-9">
          <p className="kicker !text-[var(--gold)]">Tonight&apos;s desk</p>
          <h1 className="page-title serif mt-2 text-4xl text-[#f7f2e9] md:text-5xl">Explore</h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#f7f2e9]/70">
            Booking windows, rare vault findings, and taste matches — never live Resy scrapes.
          </p>
          <ol className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-[#f7f2e9]/55">
            <li>
              <span className="text-[var(--gold)]">Drop</span> a screenshot
            </li>
            <li>
              <span className="text-[var(--gold)]">Confirm</span> the place
            </li>
            <li>
              <span className="text-[var(--gold)]">Date</span> the occasion
            </li>
          </ol>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              { n: vaultCount, label: "Vault places" },
              { n: planCount, label: "Plans" },
              { n: alerts.length, label: "Alerts" },
            ].map((s) => (
              <div key={s.label} className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 px-4 py-3">
                <p className="serif-italic text-3xl text-[#f7f2e9]">{loading ? "—" : s.n}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--gold)]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-8 md:grid-cols-[1.15fr_0.85fr] md:gap-10">
          <section className="space-y-6">
            <article className="card-light rounded-[var(--radius-xl)] p-5 md:p-6">
              <p className="kicker">{next.kicker}</p>
              <h2 className="serif-italic mt-2 text-2xl md:text-3xl">{next.title}</h2>
              <p className="page-lead mt-2">{next.body}</p>
              <Link
                href={next.href}
                className="focus-ring mt-5 inline-flex min-h-[44px] items-center rounded-full bg-[var(--ink)] px-5 text-sm text-white hover:bg-black"
              >
                {next.cta}
              </Link>
            </article>

            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="kicker">{live ? "Live alerts" : "Proactive alerts"}</p>
                <h2 className="serif mt-1 text-2xl">What Aura is watching</h2>
              </div>
              <Link
                href="/capture"
                className="focus-ring hidden min-h-[44px] items-center rounded-full bg-[var(--ink)] px-4 text-[11px] uppercase tracking-[0.16em] text-white md:inline-flex"
              >
                Capture
              </Link>
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : alerts.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {alerts.slice(0, 6).map((a) => (
                  <AlertCard key={a._id} alert={a} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <EmptyState
                  kicker="Quiet for now"
                  title="No alerts yet"
                  body="Save places to The Vault and set plan dates. Aura generates booking-window and taste alerts from your data — not inventory scrapes."
                  href="/capture"
                  cta="Add a place"
                />
                <p className="kicker px-1">Examples</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {SAMPLE_ALERTS.map((a) => (
                    <article key={a._id} className="card-light rounded-[var(--radius-xl)] p-5">
                      <p className="kicker">{a.title}</p>
                      <h3 className="serif-italic mt-2 text-2xl">{a.placeName}</h3>
                      <p className="page-lead mt-2">{a.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-5">
            <div className="card-light rounded-[var(--radius-xl)] p-5 md:p-6">
              <p className="kicker">Vault map</p>
              <h2 className="serif-italic mt-2 text-2xl md:text-[1.75rem]">Your pins</h2>
              <div className="mt-4 overflow-hidden rounded-[var(--radius-lg)]">
                <BoardMap pins={pins} heightClass="h-64 md:h-80" />
              </div>
            </div>
            <div className="card-light rounded-[var(--radius-xl)] p-5 md:p-6">
              <p className="kicker">Taste profile</p>
              <h2 className="serif-italic mt-2 text-2xl md:text-[1.75rem]">What Aura watches</h2>
              <p className="page-lead mt-2">Tap chips to refine preference-match alerts.</p>
              <div className="mt-4">
                <TasteChips />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
