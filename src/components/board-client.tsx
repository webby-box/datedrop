"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BoardMap } from "./board-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { bookingDeepLink, NO_INVENTORY_COPY } from "@/lib/booking";
import { useRouteId } from "@/lib/use-route-id";
import { boardPlanHref, placeHref } from "@/lib/static-mode";

type Place = {
  externalPlaceId?: string;
  googlePlaceId?: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  rating?: number;
  primaryType?: string;
  websiteUri?: string;
  bookingPlatform: "resy" | "opentable" | "tock" | "sevenrooms" | "website" | "unknown";
  provider?: string;
};

function pid(p: Place) {
  return p.externalPlaceId || p.googlePlaceId || p.name;
}

export function BoardClient({
  id: paramId,
  attribution,
}: {
  id: string;
  attribution?: string;
  /** @deprecated unused — MapLibre needs no Google key */
  mapsKey?: string;
}) {
  const id = useRouteId(paramId);
  const [data, setData] = useState<{
    board: { title: string; city: string; startDate?: string; endDate?: string; partySize: number };
    places: Place[];
    similar: Place[];
  } | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [party, setParty] = useState(2);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/boards/${id}`);
      const json = await res.json();
      if (!res.ok) {
        setErr(json.error);
        return;
      }
      setData(json);
      setStart(json.board.startDate || "");
      setEnd(json.board.endDate || "");
      setParty(json.board.partySize || 2);
    })();
  }, [id]);

  async function saveDates() {
    await fetch(`/api/boards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: start, endDate: end, partySize: party }),
    });
  }

  if (err) return <p className="px-5 py-16 text-[var(--skip)]">{err}</p>;
  if (!data) return <p className="px-5 py-16 text-[var(--muted)]">Loading board…</p>;

  const groups = new Map<string, Place[]>();
  for (const p of data.places) {
    const key = p.formattedAddress.split(",")[1]?.trim() || data.board.city;
    groups.set(key, [...(groups.get(key) || []), p]);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <p className="kicker">Board</p>
      <h1 className="serif mt-2 text-5xl">{data.board.title}</h1>
      <p className="mt-2 text-[var(--muted)]">Grouped by city from confirmed places — not a guess.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
        <BoardMap
          attribution={attribution}
          pins={data.places.map((p) => ({ lat: p.lat, lng: p.lng, name: p.name }))}
        />
        <form
          className="card-light space-y-3 rounded-2xl p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void saveDates();
          }}
        >
          <p className="kicker">When</p>
          <label className="block text-xs text-[var(--muted)]">
            Start
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label className="block text-xs text-[var(--muted)]">
            End
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
          <label className="block text-xs text-[var(--muted)]">
            Party size
            <Input type="number" min={1} max={20} value={party} onChange={(e) => setParty(Number(e.target.value))} />
          </label>
          <Button type="submit" className="w-full">Save dates</Button>
          <Link href={boardPlanHref(id)} className="block text-center text-sm text-[#111]">
            Open plan →
          </Link>
        </form>
      </div>

      {[...groups.entries()].map(([g, places]) => (
        <section key={g} className="mt-10">
          <h2 className="serif text-3xl">{g}</h2>
          <ul className="mt-4 divide-y divide-[rgba(17,17,17,0.08)]">
            {places.map((p) => {
              const book = bookingDeepLink({
                name: p.name,
                websiteUri: p.websiteUri,
                platform: p.bookingPlatform,
                date: start,
                partySize: party,
              });
              const key = pid(p);
              return (
                <li key={key} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <Link href={placeHref(key)} className="serif text-2xl">
                      {p.name}
                    </Link>
                    <p className="text-sm text-[var(--muted)]">{p.formattedAddress}</p>
                  </div>
                  <a href={book.url} target="_blank" rel="noreferrer" className="text-sm text-[#111]">
                    {book.label} ↗
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {data.similar?.length ? (
        <section className="mt-12">
          <p className="kicker">Similar nearby</p>
          <h2 className="serif mt-2 text-3xl">Not from your screenshots</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {data.similar.map((s) => (
              <Badge key={pid(s)}>{s.name}</Badge>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-10 max-w-xl text-sm text-[var(--muted)]">{NO_INVENTORY_COPY}</p>
    </div>
  );
}
