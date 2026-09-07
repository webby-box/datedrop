"use client";

import { useEffect, useState } from "react";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [aRes, vRes] = await Promise.all([fetch("/api/alerts"), fetch("/api/vault")]);
        const aJson = await aRes.json();
        const vJson = await vRes.json();
        if (aRes.ok) {
          setAlerts(aJson.alerts || []);
          setLive(Boolean(aJson.live));
        }
        if (vRes.ok) {
          setPins(
            (vJson.items || [])
              .filter((i: VaultPin) => i.lat && i.lng)
              .map((i: VaultPin & { name: string }) => ({
                lat: i.lat,
                lng: i.lng,
                name: i.name,
                placeId: i.placeId,
              })),
          );
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppShell live={live}>
      <div className="grid gap-8 py-6 md:grid-cols-[1.15fr_0.85fr] md:gap-10 md:py-10">
        <section className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="kicker flex flex-wrap items-center gap-2">
                {live ? (
                  <>
                    <span className="inline-flex h-5 items-center gap-1.5 rounded-full bg-[var(--ink)] px-2 text-[9px] tracking-[0.16em] text-white">
                      <span className="live-dot" /> Live
                    </span>
                    Proactive alerts
                  </>
                ) : (
                  "Proactive alerts"
                )}
              </p>
              <h1 className="page-title serif mt-2 text-4xl md:text-5xl">Explore</h1>
              <p className="page-lead mt-2.5 max-w-md">
                Booking windows, rare vault findings, and taste matches — never live Resy scrapes.
              </p>
            </div>
            <Link
              href="/capture"
              className="focus-ring hidden min-h-[44px] items-center rounded-full bg-[var(--ink)] px-4 text-[11px] uppercase tracking-[0.16em] text-white transition hover:bg-black md:inline-flex"
            >
              Capture
            </Link>
          </div>

          <ol className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
            <li>
              <span className="text-[var(--ink)]">Drop</span> a screenshot
            </li>
            <li>
              <span className="text-[var(--ink)]">Confirm</span> the place
            </li>
            <li>
              <span className="text-[var(--ink)]">Date</span> the occasion
            </li>
          </ol>

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
    </AppShell>
  );
}
