"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AppShell } from "./app-shell";
import { Skeleton } from "./skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BoardMap } from "@/components/board-map";
import { ArrowLeft, Download } from "lucide-react";

type Board = {
  _id: string;
  title: string;
  city: string;
  startDate?: string;
  endDate?: string;
  partySize: number;
  lat?: number;
  lng?: number;
};
type Place = { name: string; lat: number; lng: number; externalPlaceId?: string; googlePlaceId?: string };
type Plan = {
  dates: { start: string; end: string };
  partySize: number;
  seasonality: {
    verdict: string;
    meanMaxC: number;
    meanMinC: number;
    precipMm: number;
    prose: string;
    skipped?: boolean;
  };
  days: { date: string; title: string; items: { name: string; window: string; note: string; suggested?: boolean }[] }[];
  bookingCopy: string;
};
type ChecklistItem = { name: string; url: string; label: string; copy: string };

export function PlanDetailClient({ id }: { id: string }) {
  const [board, setBoard] = useState<Board | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [attr, setAttr] = useState("Climate: Open-Meteo archive 1991–2020.");
  const [busy, setBusy] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [partySize, setPartySize] = useState(2);

  useEffect(() => {
    void (async () => {
      const [bRes, pRes] = await Promise.all([
        fetch(`/api/boards/${id}`),
        fetch(`/api/boards/${id}/plan`),
      ]);
      const bJson = await bRes.json();
      const pJson = await pRes.json();
      if (bRes.ok) {
        setBoard(bJson.board);
        setPlaces(bJson.places || []);
        setStartDate(bJson.board?.startDate || "");
        setEndDate(bJson.board?.endDate || "");
        setPartySize(bJson.board?.partySize || 2);
      }
      if (pRes.ok && pJson.plan) setPlan(pJson.plan);
    })();
  }, [id]);

  async function saveDates() {
    const res = await fetch(`/api/boards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate, partySize }),
    });
    if (!res.ok) {
      toast.error("Could not save dates");
      return;
    }
    toast.success("Dates updated");
  }

  async function generate() {
    setBusy(true);
    await saveDates();
    const res = await fetch(`/api/boards/${id}/plan`, { method: "POST" });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.error(json.error || "Plan failed");
      return;
    }
    setPlan(json.plan);
    setChecklist(json.checklist || []);
    setAttr(json.attribution || attr);
    toast.success("Itinerary ready");
  }

  function markdown() {
    if (!plan || !board) return "";
    return [
      `# Aura plan — ${board.city}`,
      `${plan.dates.start} → ${plan.dates.end} · party of ${plan.partySize}`,
      "",
      plan.bookingCopy,
      "",
      `## Seasonality (${plan.seasonality.verdict})`,
      plan.seasonality.prose,
      "",
      "## Open to book",
      ...checklist.map((c) => `- [${c.name}](${c.url}) — ${c.label}`),
      "",
      "## Days",
      ...plan.days.flatMap((d) => [
        `### ${d.date} — ${d.title}`,
        ...d.items.map(
          (i) =>
            `- ${i.window}: ${i.name}${i.suggested ? " _(Suggested)_" : ""} — ${i.note}`,
        ),
        "",
      ]),
      "",
      attr,
      "Aura identifies the place and opens the booking site. We don't have live table inventory.",
    ].join("\n");
  }

  function downloadMd() {
    const blob = new Blob([markdown()], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `aura-plan-${board?.city || id}.md`;
    a.click();
  }

  return (
    <AppShell>
      <div className="py-6 md:py-10">
        <Link href="/plans" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#6b6b6b]">
          <ArrowLeft className="h-3.5 w-3.5" /> Plans
        </Link>

        {!board ? (
          <div className="mt-8 space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="kicker">{board.city}</p>
              <h1 className="serif-italic mt-2 text-4xl md:text-5xl">{board.title}</h1>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11 rounded-2xl bg-white" />
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11 rounded-2xl bg-white" />
                <Input type="number" min={1} max={12} value={partySize} onChange={(e) => setPartySize(Number(e.target.value) || 2)} className="h-11 rounded-2xl bg-white" />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={() => void generate()} disabled={busy}>
                  {busy ? "Generating…" : "Generate itinerary + climate"}
                </Button>
                {plan ? (
                  <Button variant="outline" onClick={downloadMd}>
                    <Download className="h-4 w-4" /> Markdown
                  </Button>
                ) : null}
              </div>

              {plan ? (
                <div className="mt-8 space-y-5">
                  <article className="card-light rounded-[24px] p-5">
                    <p className="kicker">Seasonality · {plan.seasonality.verdict}</p>
                    <p className="mt-3 text-sm leading-relaxed">{plan.seasonality.prose}</p>
                    {!plan.seasonality.skipped ? (
                      <p className="mt-2 text-xs text-[#6b6b6b]">
                        Highs {Math.round(plan.seasonality.meanMaxC)}°C / lows {Math.round(plan.seasonality.meanMinC)}°C · ~
                        {Math.round(plan.seasonality.precipMm)} mm · {attr}
                      </p>
                    ) : null}
                  </article>
                  <article className="card-light rounded-[24px] p-5">
                    <p className="kicker">Intro</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{plan.bookingCopy}</p>
                  </article>
                  {plan.days.map((d) => (
                    <article key={d.date} className="card-light rounded-[24px] p-5">
                      <p className="kicker">{d.date}</p>
                      <h3 className="serif-italic mt-1 text-2xl">{d.title}</h3>
                      <ul className="mt-3 space-y-2">
                        {d.items.map((i, idx) => (
                          <li key={idx} className="text-sm">
                            <span className="font-medium">{i.window}</span> — {i.name}
                            {i.suggested ? <span className="text-[#6b6b6b]"> (suggested)</span> : null}
                            <span className="block text-[#6b6b6b]">{i.note}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                  {checklist.length ? (
                    <article className="card-dark rounded-[24px] p-5">
                      <p className="kicker !text-white/50">Open to book</p>
                      <ul className="mt-3 space-y-2">
                        {checklist.map((c) => (
                          <li key={c.name}>
                            <a href={c.url} target="_blank" rel="noreferrer" className="text-white underline-offset-2 hover:underline">
                              {c.name}
                            </a>
                            <span className="block text-xs text-white/60">{c.label}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ) : null}
                </div>
              ) : (
                <p className="mt-8 text-sm text-[#6b6b6b]">Set dates, then generate an itinerary from vault places in this city.</p>
              )}
            </div>

            <aside className="space-y-4">
              <div className="card-light rounded-[28px] p-5">
                <p className="kicker">Map</p>
                <div className="mt-3">
                  <BoardMap
                    pins={places.map((p) => ({ lat: p.lat, lng: p.lng, name: p.name }))}
                    heightClass="h-72"
                  />
                </div>
              </div>
              <div className="card-light rounded-[28px] p-5">
                <p className="kicker">Vault places</p>
                <ul className="mt-3 space-y-2">
                  {places.length ? (
                    places.map((p) => (
                      <li key={p.name}>
                        <Link
                          href={`/vault/${encodeURIComponent(p.externalPlaceId || p.googlePlaceId || "")}`}
                          className="serif-italic text-xl hover:underline"
                        >
                          {p.name}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-[#6b6b6b]">
                      No places yet. <Link href="/capture" className="underline">Capture</Link> into this city.
                    </li>
                  )}
                </ul>
              </div>
            </aside>
          </div>
        )}
      </div>
    </AppShell>
  );
}
