"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { OccasionChips } from "@/components/aura/occasion-chips";
import { useRouteId } from "@/lib/use-route-id";
import { vaultHref } from "@/lib/static-mode";

type Match = {
  externalPlaceId?: string;
  googlePlaceId?: string;
  name: string;
  formattedAddress: string;
  rating?: number;
  provider?: string;
};

type Candidate = {
  kind: string;
  name: string;
  city?: string;
  neighborhood?: string;
  country?: string;
  cues: string[];
  confidence: number;
  sourceHint: string;
  matches: Match[];
};

type Capture = {
  _id: string;
  status: string;
  blobUrls: string[];
  extraction?: { summary: string; candidates: Candidate[] };
  error?: string;
};

function mid(m: Match) {
  return m.externalPlaceId || m.googlePlaceId || m.name;
}

export function CaptureConfirm({ id: paramId }: { id: string }) {
  const id = useRouteId(paramId);
  const router = useRouter();
  const [cap, setCap] = useState<Capture | null>(null);
  const [q, setQ] = useState("");
  const [searchHits, setSearchHits] = useState<Match[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [occasion, setOccasion] = useState("want");

  useEffect(() => {
    let stop = false;
    async function tick() {
      const res = await fetch(`/api/captures/${id}`);
      const json = await res.json();
      if (!stop && json.capture) setCap(json.capture);
    }
    void tick();
    const t = setInterval(() => void tick(), 1500);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [id]);

  async function act(body: Record<string, unknown>) {
    setMsg(null);
    const res = await fetch(`/api/captures/${id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg(json.error);
      return json;
    }
    if (json.placeId) {
      toast.success("Saved to The Vault");
      router.push(vaultHref(json.placeId));
      return json;
    }
    if (json.boardId) {
      toast.success("Saved to The Vault");
      router.push("/vault");
      return json;
    }
    return json;
  }

  if (!cap) return <div className="px-1 py-10 md:px-0 md:py-12"><p className="kicker">Capture</p><p className="page-lead mt-3">Loading capture…</p></div>;
  if (cap.status === "processing") {
    return (
      <div className="px-1 py-10 md:px-0 md:py-12">
        <p className="kicker">Reading the chrome</p>
        <h1 className="page-title serif mt-2 text-4xl">Pin, rating row, bottom sheet…</h1>
        <p className="page-lead mt-3">Vision model is extracting visible places only.</p>
      </div>
    );
  }
  if (cap.status === "failed") {
    return (
      <div className="px-1 py-10 md:px-0 md:py-12">
        <h1 className="page-title serif text-4xl">Could not read this drop</h1>
        <p className="mt-3 text-[var(--skip)]">{cap.error}</p>
      </div>
    );
  }

  const cands = cap.extraction?.candidates || [];

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        {cap.blobUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cap.blobUrls[0]} alt="Dropped screenshot" className="card-light w-full rounded-[var(--radius-xl)] object-cover" />
        ) : (
          <div className="card-light flex h-72 items-center justify-center text-[var(--muted)]">URL capture — no image</div>
        )}
        <p className="mt-4 text-sm text-[var(--muted)]">{cap.extraction?.summary}</p>
      </div>
      <div>
        <p className="kicker">Confirm — never auto-saved</p>
        <h1 className="page-title serif mt-2 text-4xl">Is this the place?</h1>
        {msg && <p className="mt-3 text-sm text-[var(--skip)]">{msg}</p>}
        <div className="mt-6">
          <p className="kicker mb-3">Occasion</p>
          <OccasionChips value={occasion} onChange={setOccasion} />
        </div>
        <div className="mt-6 space-y-8">
          {cands.map((c, ci) => (
            <section key={`${c.name}-${ci}`} className="card-light rounded-[var(--radius-lg)] p-5">
              <div className="flex flex-wrap gap-2">
                <Badge>{c.kind}</Badge>
                <Badge>{c.sourceHint.replace("_", " ")}</Badge>
                <Badge>{Math.round(c.confidence * 100)}%</Badge>
              </div>
              <h2 className="serif-italic mt-3 text-3xl leading-tight">{c.name}</h2>
              <p className="text-sm text-[var(--muted)]">
                {[c.neighborhood, c.city, c.country].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-2 text-xs text-[var(--muted)]">Cues: {c.cues.join(", ") || "none"}</p>
              <ul className="mt-4 space-y-2">
                {(c.matches || []).slice(0, 3).map((m, mi) => (
                  <li key={mid(m)} className="flex items-start justify-between gap-3 border-t border-[var(--line)] py-3">
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-sm text-[var(--muted)]">{m.formattedAddress}</p>
                      {m.rating ? <p className="text-xs text-[var(--ink)]">{m.rating} rating</p> : null}
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        void act({
                          action: "save",
                          candidateIndex: ci,
                          matchIndex: mi,
                          externalPlaceId: mid(m),
                          occasion,
                        })
                      }
                    >
                      Save
                    </Button>
                  </li>
                ))}
              </ul>
              {!c.matches?.length && (
                <p className="mt-3 text-sm text-[var(--caution)]">No place matches yet — search instead.</p>
              )}
            </section>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void act({ action: "skip" })}>Skip</Button>
          <Button variant="ghost" onClick={() => void act({ action: "not_a_place" })}>Not a place</Button>
        </div>
        <form
          className="mt-6 flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const json = await act({ action: "search", query: q });
            if (json?.matches) setSearchHits(json.matches);
          }}
        >
          <Input placeholder="Search places instead" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button type="submit" variant="default">Search</Button>
        </form>
        {searchHits && (
          <ul className="mt-4 space-y-2">
            {searchHits.map((m) => (
              <li key={mid(m)} className="flex justify-between gap-3">
                <div>
                  <p>{m.name}</p>
                  <p className="text-sm text-[var(--muted)]">{m.formattedAddress}</p>
                </div>
                <Button size="sm" onClick={() => void act({ action: "save", externalPlaceId: mid(m), occasion })}>
                  Save
                </Button>
              </li>
            ))}
          </ul>
        )}
        <p className="map-attribution mt-6">
          Place data from OpenStreetMap via Geoapify / LocationIQ / Nominatim. Confirm a match — we never auto-save a guess.
        </p>
      </div>
    </div>
  );
}
