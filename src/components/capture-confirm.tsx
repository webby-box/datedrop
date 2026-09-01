"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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

export function CaptureConfirm({ id }: { id: string }) {
  const router = useRouter();
  const [cap, setCap] = useState<Capture | null>(null);
  const [q, setQ] = useState("");
  const [searchHits, setSearchHits] = useState<Match[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

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
    if (json.boardId) router.push(`/boards/${json.boardId}`);
    return json;
  }

  if (!cap) return <p className="px-5 py-16 text-[#9a8f7e]">Loading capture…</p>;
  if (cap.status === "processing") {
    return (
      <div className="px-5 py-16">
        <p className="kicker">Reading the chrome</p>
        <h1 className="serif mt-2 text-4xl">Pin, rating row, bottom sheet…</h1>
        <p className="mt-3 text-[#9a8f7e]">Vision model is extracting visible places only.</p>
      </div>
    );
  }
  if (cap.status === "failed") {
    return (
      <div className="px-5 py-16">
        <h1 className="serif text-4xl">Could not read this drop</h1>
        <p className="mt-3 text-[#b5523a]">{cap.error}</p>
      </div>
    );
  }

  const cands = cap.extraction?.candidates || [];

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        {cap.blobUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cap.blobUrls[0]} alt="Dropped screenshot" className="polaroid w-full rounded-md object-cover" />
        ) : (
          <div className="polaroid flex h-72 items-center justify-center text-[#9a8f7e]">URL capture — no image</div>
        )}
        <p className="mt-4 text-sm text-[#9a8f7e]">{cap.extraction?.summary}</p>
      </div>
      <div>
        <p className="kicker">Confirm — never auto-saved</p>
        <h1 className="serif mt-2 text-4xl">Is this the place?</h1>
        {msg && <p className="mt-3 text-sm text-[#b5523a]">{msg}</p>}
        <div className="mt-6 space-y-8">
          {cands.map((c, ci) => (
            <section key={`${c.name}-${ci}`} className="ticket rounded-2xl p-5">
              <div className="flex flex-wrap gap-2">
                <Badge>{c.kind}</Badge>
                <Badge>{c.sourceHint.replace("_", " ")}</Badge>
                <Badge>{Math.round(c.confidence * 100)}%</Badge>
              </div>
              <h2 className="serif mt-3 text-3xl">{c.name}</h2>
              <p className="text-sm text-[#9a8f7e]">
                {[c.neighborhood, c.city, c.country].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-2 text-xs text-[#9a8f7e]">Cues: {c.cues.join(", ") || "none"}</p>
              <ul className="mt-4 space-y-2">
                {(c.matches || []).slice(0, 3).map((m, mi) => (
                  <li key={mid(m)} className="flex items-start justify-between gap-3 border-t border-[rgba(244,234,213,0.08)] py-3">
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-sm text-[#9a8f7e]">{m.formattedAddress}</p>
                      {m.rating ? <p className="text-xs text-[#d4a574]">{m.rating} rating</p> : null}
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        void act({
                          action: "save",
                          candidateIndex: ci,
                          matchIndex: mi,
                          externalPlaceId: mid(m),
                        })
                      }
                    >
                      Save
                    </Button>
                  </li>
                ))}
              </ul>
              {!c.matches?.length && (
                <p className="mt-3 text-sm text-[#c9a227]">No place matches yet — search instead.</p>
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
          <Button type="submit" variant="amber">Search</Button>
        </form>
        {searchHits && (
          <ul className="mt-4 space-y-2">
            {searchHits.map((m) => (
              <li key={mid(m)} className="flex justify-between gap-3">
                <div>
                  <p>{m.name}</p>
                  <p className="text-sm text-[#9a8f7e]">{m.formattedAddress}</p>
                </div>
                <Button size="sm" onClick={() => void act({ action: "save", externalPlaceId: mid(m) })}>
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
