"use client";

import { useEffect, useState } from "react";
import { BoardMap } from "./board-map";
import { Badge } from "@/components/ui/badge";
import { NO_INVENTORY_COPY } from "@/lib/booking";

type Place = {
  externalPlaceId?: string;
  googlePlaceId?: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
  phone?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  bookingPlatform: string;
  provider?: string;
};

function pid(p: { externalPlaceId?: string; googlePlaceId?: string; name?: string }) {
  return p.externalPlaceId || p.googlePlaceId || p.name || "";
}

export function PlaceClient({
  id,
  attribution,
}: {
  id: string;
  attribution?: string;
  /** @deprecated unused */
  mapsKey?: string;
}) {
  const [data, setData] = useState<{
    place: Place;
    screenshots: string[];
    similar: { name: string; externalPlaceId?: string; googlePlaceId?: string }[];
    book: { url: string; label: string };
    copy: string;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/places/${encodeURIComponent(id)}`);
      const json = await res.json();
      if (!res.ok) setErr(json.error);
      else setData(json);
    })();
  }, [id]);

  if (err) return <p className="px-5 py-16 text-[var(--skip)]">{err}</p>;
  if (!data) return <p className="px-5 py-16 text-[var(--muted)]">Loading place…</p>;
  const p = data.place;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <p className="kicker">{p.primaryType?.replace(/_/g, " ") || "place"}</p>
      <h1 className="serif mt-2 text-5xl">{p.name}</h1>
      <p className="mt-2 text-[var(--muted)]">{p.formattedAddress}</p>
      {p.rating ? (
        <p className="mt-2 text-sm text-[#111]">
          {p.rating}
          {p.userRatingCount ? ` · ${p.userRatingCount} reviews` : ""}
        </p>
      ) : null}
      <div className="mt-6">
        <BoardMap
          attribution={attribution}
          pins={[{ lat: p.lat, lng: p.lng, name: p.name }]}
        />
      </div>
      <a
        href={data.book.url}
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-block rounded-full bg-[#c45c26] px-6 py-3"
      >
        {data.book.label}
      </a>
      <p className="mt-3 text-sm text-[var(--muted)]">{data.copy || NO_INVENTORY_COPY}</p>
      {data.screenshots?.length ? (
        <div className="mt-10 grid grid-cols-2 gap-3">
          {data.screenshots.map((s) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={s} src={s} alt="Your screenshot" className="polaroid" />
          ))}
        </div>
      ) : null}
      {data.similar?.length ? (
        <div className="mt-10">
          <p className="kicker">Similar</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.similar.map((s) => (
              <Badge key={pid(s)}>{s.name}</Badge>
            ))}
          </div>
        </div>
      ) : null}
      {p.googleMapsUri && (
        <a href={p.googleMapsUri} className="mt-8 inline-block text-sm text-[#111]" target="_blank" rel="noreferrer">
          Open map ↗
        </a>
      )}
    </div>
  );
}
