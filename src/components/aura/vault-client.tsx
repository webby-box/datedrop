"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./app-shell";
import { VaultCard, type VaultItem } from "./vault-card";
import { EmptyState } from "./empty-state";
import { CardSkeleton } from "./skeleton";
import { Input } from "@/components/ui/input";
import { OccasionChips } from "./occasion-chips";
import { PLACE_STATUSES } from "@/lib/place-status";
import { cn } from "@/lib/utils";

export function VaultClient() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [occasion, setOccasion] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      void (async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (city) params.set("city", city);
        if (occasion) params.set("occasion", occasion);
        if (status) params.set("status", status);
        const res = await fetch(`/api/vault?${params}`);
        const json = await res.json();
        if (res.ok) {
          setItems(json.items || []);
          setCities(json.cities || []);
        }
        setLoading(false);
      })();
    }, 200);
    return () => clearTimeout(t);
  }, [q, city, occasion, status]);

  const countLabel = useMemo(() => `${items.length} place${items.length === 1 ? "" : "s"}`, [items.length]);

  return (
    <AppShell>
      <div className="py-6 md:py-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="kicker">The Vault</p>
            <h1 className="page-title serif mt-2 text-4xl md:text-5xl">Saved rooms</h1>
            <p className="page-lead mt-2.5">{countLabel} · city, occasion, or booking status</p>
          </div>
          <div className="flex w-full flex-col gap-2.5 sm:flex-row md:w-auto md:min-w-[380px]">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by name…"
              aria-label="Filter vault by name"
            />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              aria-label="Filter by city"
              className="control select-aura w-full sm:w-[11rem]"
            >
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <OccasionChips value={occasion} onChange={setOccasion} allowAll />
          <div className="flex flex-wrap gap-2" role="listbox" aria-label="Status">
            <button
              type="button"
              onClick={() => setStatus("")}
              className={cn(
                "focus-ring rounded-full px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.14em] transition",
                !status ? "bg-[var(--ink)] text-white" : "bg-black/[0.04] text-[var(--muted)] hover:bg-black/[0.08]",
              )}
            >
              Any status
            </button>
            {PLACE_STATUSES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatus(s.id)}
                className={cn(
                  "focus-ring rounded-full px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.14em] transition",
                  status === s.id
                    ? "bg-[var(--ink)] text-white"
                    : "bg-black/[0.04] text-[var(--muted)] hover:bg-black/[0.08]",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 md:mt-10">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : items.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <VaultCard key={`${item.placeId}-${item.city}`} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="The Vault is empty"
              body="Upload a Maps screenshot or paste a Maps URL. Confirm the match — Aura never auto-saves a guess."
              href="/capture"
              cta="Capture a place"
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
