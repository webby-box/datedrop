"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BoardMap } from "./board-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { bookingDeepLink, NO_INVENTORY_COPY } from "@/lib/booking";

type Place = {
  googlePlaceId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  rating?: number;
  primaryType?: string;
  websiteUri?: string;
  bookingPlatform: "resy" | "opentable" | "tock" | "sevenrooms" | "website" | "unknown";
};

export function BoardClient({ id, mapsKey }: { id: string; mapsKey?: string }) {
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

  if (err) return <p className="px-5 py-16 text-[#b5523a]">{err}</p>;
  if (!data) return <p className="px-5 py-16 text-[#9a8f7e]">Loading board…</p>;

  const groups = new Map<string, Place[]>();
  for (const p of data.places) {
    const key = p.formattedAddress.split(",")[1]?.trim() || data.board.city;
    groups.set(key, [...(groups.get(key) || []), p]);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <p className="kicker">Board</p>
      <h1 className="serif mt-2 text-5xl">{data.board.title}</h1>
      <p className="mt-2 text-[#9a8f7e]">Grouped by city from confirmed Google Places — not a guess.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
        <BoardMap
          apiKey={mapsKey}
          pins={data.places.map((p) => ({ lat: p.lat, lng: p.lng, name: p.name }))}
        />
        <form
          className="ticket space-y-3 rounded-2xl p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void saveDates();
          }}
        >
          <p className="kicker">When</p>
          <label className="block text-xs text-[#9a8f7e]">
            Start
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label className="block text-xs text-[#9a8f7e]">
            End
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
          <label className="block text-xs text-[#9a8f7e]">
            Party size
            <Input type="number" min={1} max={20} value={party} onChange={(e) => setParty(Number(e.target.value))} />
          </label>
          <Button type="submit" className="w-full">Save dates</Button>
          <Link href={`/boards/${id}/plan`} className="block text-center text-sm text-[#d4a574]">
            Open plan →
          </Link>
        </form>
      </div>

      {[...groups.entries()].map(([g, places]) => (
        <section key={g} className="mt-10">
          <h2 className="serif text-3xl">{g}</h2>
          <ul className="mt-4 divide-y divide-[rgba(244,234,213,0.08)]">
            {places.map((p) => {
              const book = bookingDeepLink({
                name: p.name,
                websiteUri: p.websiteUri,
                platform: p.bookingPlatform,
                date: start,
                partySize: party,
              });
              return (
                <li key={p.googlePlaceId} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <Link href={`/places/${p.googlePlaceId}`} className="serif text-2xl">
                      {p.name}
                    </Link>
                    <p className="text-sm text-[#9a8f7e]">{p.formattedAddress}</p>
                  </div>
                  <a href={book.url} target="_blank" rel="noreferrer" className="text-sm text-[#d4a574]">
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
              <Badge key={s.googlePlaceId || s.name}>{s.name}</Badge>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-10 max-w-xl text-sm text-[#9a8f7e]">{NO_INVENTORY_COPY}</p>
    </div>
  );
}
