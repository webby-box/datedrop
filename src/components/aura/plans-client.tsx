"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "./app-shell";
import { EmptyState } from "./empty-state";
import { CardSkeleton } from "./skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PlanBoard = {
  _id: string;
  title: string;
  city: string;
  country?: string;
  startDate?: string;
  endDate?: string;
  partySize: number;
  placeCount?: number;
};

export function PlansClient() {
  const router = useRouter();
  const [boards, setBoards] = useState<PlanBoard[]>([]);
  const [vaultCities, setVaultCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const [bRes, vRes] = await Promise.all([fetch("/api/boards"), fetch("/api/vault")]);
    const bJson = await bRes.json();
    const vJson = await vRes.json();
    if (bRes.ok) setBoards(bJson.boards || []);
    if (vRes.ok) setVaultCities(vJson.cities || []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    if (!city.trim() || !startDate) {
      toast.error("City and start date required");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: city.trim(),
        title: city.trim(),
        startDate,
        endDate: endDate || startDate,
        partySize,
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.error(json.error || "Could not create plan");
      return;
    }
    toast.success("Plan saved");
    setCity("");
    await load();
    if (json.board?._id) router.push(`/plans/${json.board._id}`);
  }

  return (
    <AppShell>
      <div className="py-6 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
          <section className="card-light rounded-[var(--radius-xl)] p-6 md:p-7">
            <p className="kicker">New plan</p>
            <h1 className="page-title serif mt-2 text-4xl">Dates & party</h1>
            <p className="page-lead mt-2.5">
              Create from city + dates. Itinerary & Open-Meteo climate generate on the detail page.
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="field-label" htmlFor="plan-city">
                  City
                </label>
                <Input
                  id="plan-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City (e.g. New York)"
                />
                {vaultCities.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {vaultCities.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCity(c)}
                        className="chip hover:bg-black/10"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="plan-start">
                    Start
                  </label>
                  <Input id="plan-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="field-label" htmlFor="plan-end">
                    End
                  </label>
                  <Input id="plan-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="plan-party">
                  Party size
                </label>
                <Input
                  id="plan-party"
                  type="number"
                  min={1}
                  max={12}
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value) || 2)}
                  aria-label="Party size"
                />
              </div>
              <Button className="w-full" disabled={busy} onClick={() => void create()}>
                {busy ? "Saving…" : "Create plan"}
              </Button>
            </div>
          </section>

          <section>
            <p className="kicker">Your plans</p>
            <h2 className="serif-italic mt-2 text-3xl md:text-[2rem]">Itineraries</h2>
            <div className="mt-6 space-y-3">
              {loading ? (
                <>
                  <CardSkeleton />
                  <CardSkeleton />
                </>
              ) : boards.length ? (
                boards.map((b) => (
                  <Link
                    key={b._id}
                    href={`/plans/${b._id}`}
                    className="card-light card-interactive fade-up flex items-center justify-between gap-4 rounded-[var(--radius-lg)] p-5"
                  >
                    <div>
                      <p className="kicker">
                        {b.city}
                        {b.country ? ` · ${b.country}` : ""}
                      </p>
                      <h3 className="serif-italic mt-1.5 text-2xl leading-tight">{b.title}</h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
                        {b.startDate || "Dates unset"}
                        {b.endDate ? ` → ${b.endDate}` : ""} · party of {b.partySize} · {b.placeCount || 0}{" "}
                        vault places
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-[var(--gold-deep)]">
                      Open →
                    </span>
                  </Link>
                ))
              ) : (
                <EmptyState
                  title="No plans yet"
                  body="Set city and dates, or capture places first — boards become plans in Aura."
                  href="/capture"
                  cta="Capture first"
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
