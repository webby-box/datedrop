"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./app-shell";
import { VaultCard, type VaultItem } from "./vault-card";
import { EmptyState } from "./empty-state";
import { CardSkeleton } from "./skeleton";
import { Input } from "@/components/ui/input";

export function VaultClient() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      void (async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (city) params.set("city", city);
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
  }, [q, city]);

  const countLabel = useMemo(() => `${items.length} place${items.length === 1 ? "" : "s"}`, [items.length]);

  return (
    <AppShell>
      <div className="py-6 md:py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="kicker">The Vault</p>
            <h1 className="serif mt-2 text-4xl md:text-5xl">Saved rooms</h1>
            <p className="mt-2 text-sm text-[#6b6b6b]">{countLabel} · screenshots & confirmed pins</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:min-w-[360px]">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by name…"
              className="h-11 rounded-full border-[rgba(17,17,17,0.1)] bg-white"
            />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-11 rounded-full border border-[rgba(17,17,17,0.1)] bg-white px-4 text-sm"
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

        <div className="mt-8">
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
