"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export function PlanClient({ id }: { id: string }) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [attr, setAttr] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    setErr(null);
    const res = await fetch(`/api/boards/${id}/plan`, { method: "POST" });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(json.error);
      return;
    }
    setPlan(json.plan);
    setChecklist(json.checklist || []);
    setAttr(json.attribution || "Climate: Open-Meteo archive 1991–2020.");
  }

  function markdown() {
    if (!plan) return "";
    const lines = [
      `# Aura plan`,
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
        ...d.items.map((i) => `- ${i.window}: ${i.name}${i.suggested ? " _(Suggested, not from your screenshots)_" : ""} — ${i.note}`),
        "",
      ]),
      "",
      attr,
      "We identify the place and open the booking site. We don't have live table inventory.",
    ];
    return lines.join("\n");
  }

  function downloadMd() {
    const blob = new Blob([markdown()], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "aura-plan.md";
    a.click();
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <p className="kicker">Plan</p>
      <h1 className="serif mt-2 text-5xl">Does the week work?</h1>
      <p className="mt-3 text-[#2a2a2a]">
        Climate from Open-Meteo 1991–2020 normals. Booking windows, not fake slots. Itinerary from
        this board&apos;s saved places.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={() => void generate()} disabled={busy}>
          {busy ? "Composing…" : "Build plan"}
        </Button>
        {plan && (
          <Button variant="outline" onClick={downloadMd}>
            Export markdown
          </Button>
        )}
      </div>
      {err && <p className="mt-4 text-[#8b3a2f]">{err}</p>}
      {plan && (
        <div className="mt-10 space-y-10">
          <section className="card-light rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <Badge>{plan.seasonality.verdict}</Badge>
              {plan.seasonality.skipped && <span className="text-xs text-[#6b6b6b]">climate skipped</span>}
            </div>
            <p className="mt-3 text-[#2a2a2a]">{plan.seasonality.prose}</p>
            {!plan.seasonality.skipped && (
              <p className="mt-2 text-xs text-[#6b6b6b]">
                Mean max {Math.round(plan.seasonality.meanMaxC)}°C / min {Math.round(plan.seasonality.meanMinC)}°C · ~
                {Math.round(plan.seasonality.precipMm)} mm. {attr}
              </p>
            )}
          </section>
          <section>
            <h2 className="serif text-3xl">Open to book</h2>
            <ul className="mt-4 space-y-3">
              {checklist.map((c) => (
                <li key={c.name} className="flex items-center justify-between gap-3">
                  <div>
                    <p>{c.name}</p>
                    <p className="text-xs text-[#6b6b6b]">{c.copy}</p>
                  </div>
                  <a href={c.url} target="_blank" rel="noreferrer" className="text-sm text-[#111]">
                    {c.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="serif text-3xl">Day by day</h2>
            {plan.days.map((d) => (
              <div key={d.date} className="mt-5">
                <p className="kicker">{d.date}</p>
                <h3 className="serif text-2xl">{d.title}</h3>
                <ul className="mt-2 space-y-1 text-[#2a2a2a]">
                  {d.items.map((i, idx) => (
                    <li key={idx}>
                      <span className="text-[#111]">{i.window}</span> — {i.name}
                      {i.suggested ? " · Suggested, not from your screenshots" : ""} 
                      <span className="text-[#6b6b6b]"> · {i.note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
          <p className="text-sm text-[#6b6b6b]">{plan.bookingCopy}</p>
        </div>
      )}
    </div>
  );
}
