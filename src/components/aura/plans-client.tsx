"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  const [boards, setBoards] = useState<PlanBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/boards");
    const json = await res.json();
    if (res.ok) setBoards(json.boards || []);
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
    if (json.board?._id) window.location.href = `/plans/${json.board._id}`;
  }

  return (
    <AppShell>
      <div className="py-6 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="card-light rounded-[28px] p-6">
            <p className="kicker">New plan</p>
            <h1 className="serif mt-2 text-4xl">Dates & party</h1>
            <p className="mt-2 text-sm text-[#6b6b6b]">
              Create from city + dates. Itinerary & Open-Meteo climate generate on the detail page.
            </p>
            <div className="mt-6 space-y-3">
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City (e.g. New York)"
                className="h-11 rounded-2xl bg-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-11 rounded-2xl bg-white"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-11 rounded-2xl bg-white"
                />
              </div>
              <Input
                type="number"
                min={1}
                max={12}
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value) || 2)}
                className="h-11 rounded-2xl bg-white"
              />
              <Button className="w-full" disabled={busy} onClick={() => void create()}>
                {busy ? "Saving…" : "Create plan"}
              </Button>
            </div>
          </section>

          <section>
            <p className="kicker">Your plans</p>
            <h2 className="serif-italic mt-2 text-3xl">Itineraries</h2>
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
                    className="card-light fade-up flex items-center justify-between gap-4 rounded-[22px] p-5 transition hover:-translate-y-0.5"
                  >
                    <div>
                      <p className="kicker">{b.city}{b.country ? ` · ${b.country}` : ""}</p>
                      <h3 className="serif-italic mt-1 text-2xl">{b.title}</h3>
                      <p className="mt-1 text-xs text-[#6b6b6b]">
                        {b.startDate || "Dates unset"}
                        {b.endDate ? ` → ${b.endDate}` : ""} · party of {b.partySize} · {b.placeCount || 0} vault
                        places
                      </p>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#6b6b6b]">Open →</span>
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
