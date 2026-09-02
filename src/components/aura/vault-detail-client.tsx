"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "./app-shell";
import { Skeleton } from "./skeleton";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowLeft } from "lucide-react";

type Detail = {
  place: {
    placeId: string;
    name: string;
    formattedAddress: string;
    rating?: number;
    primaryType?: string;
    bookingPlatform: string;
  };
  board?: { _id: string; city: string; startDate?: string; endDate?: string; partySize?: number } | null;
  imageUrl?: string;
  logistics: { bookingStrategy: string; poseDirection: string; optimalSetting: string; cached?: boolean };
  booking: { url: string; label: string; platform: string };
  copy: string;
  draftPlan?: { boardId?: string; city?: string; dates?: { start?: string; end?: string }; partySize?: number };
};

export function VaultDetailClient({ id }: { id: string }) {
  const [data, setData] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/vault/${encodeURIComponent(id)}`);
      const json = await res.json();
      if (!res.ok) {
        setErr(json.error || "Not found");
        return;
      }
      setData(json);
    })();
  }, [id]);

  return (
    <AppShell>
      <div className="py-6 md:py-10">
        <Link href="/vault" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#6b6b6b]">
          <ArrowLeft className="h-3.5 w-3.5" /> Vault
        </Link>

        {err ? (
          <p className="mt-8 text-[#8b3a2f]">{err}</p>
        ) : !data ? (
          <div className="mt-8 space-y-4">
            <Skeleton className="h-64 w-full rounded-[28px]" />
            <Skeleton className="h-32 w-full rounded-[28px]" />
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#d9cfc4] to-[#6d635a]">
                {data.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.imageUrl} alt="" className="aspect-[16/10] w-full object-cover" />
                ) : (
                  <div className="aspect-[16/10]" />
                )}
              </div>
              <p className="kicker mt-6">{data.board?.city || "Vault"}</p>
              <h1 className="serif-italic mt-2 text-4xl md:text-5xl">{data.place.name}</h1>
              <p className="mt-2 text-sm text-[#6b6b6b]">{data.place.formattedAddress}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.place.rating ? (
                  <span className="rounded-full bg-black/5 px-3 py-1 text-[10px] uppercase tracking-[0.14em]">
                    ★ {data.place.rating.toFixed(1)}
                  </span>
                ) : null}
                <span className="rounded-full bg-black/5 px-3 py-1 text-[10px] uppercase tracking-[0.14em]">
                  {data.place.bookingPlatform}
                </span>
                {data.logistics.cached ? (
                  <span className="rounded-full bg-black/5 px-3 py-1 text-[10px] uppercase tracking-[0.14em]">
                    Logistics cached
                  </span>
                ) : null}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild>
                  <a href={data.booking.url} target="_blank" rel="noreferrer">
                    {data.booking.label} <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                {data.draftPlan?.boardId ? (
                  <Button variant="outline" asChild>
                    <Link href={`/plans/${data.draftPlan.boardId}`}>Open plan</Link>
                  </Button>
                ) : null}
              </div>
              <p className="mt-3 text-xs text-[#6b6b6b]">{data.copy}</p>
            </div>

            <div className="space-y-4">
              {[
                { label: "Booking strategy", body: data.logistics.bookingStrategy },
                { label: "Pose direction", body: data.logistics.poseDirection },
                { label: "Optimal setting", body: data.logistics.optimalSetting },
              ].map((block) => (
                <article key={block.label} className="card-light rounded-[24px] p-5">
                  <p className="kicker">{block.label}</p>
                  <p className="mt-3 text-sm leading-relaxed text-[#2a2a2a]">{block.body}</p>
                </article>
              ))}

              <article className="card-dark rounded-[24px] p-5">
                <p className="kicker !text-white/50">Draft plan</p>
                <h3 className="serif-italic mt-2 text-2xl text-white">
                  {data.draftPlan?.city || "Untitled"} · party of {data.draftPlan?.partySize || 2}
                </h3>
                <p className="mt-2 text-sm text-white/70">
                  {data.draftPlan?.dates?.start || "Set dates on Plans"}
                  {data.draftPlan?.dates?.end ? ` → ${data.draftPlan.dates.end}` : ""}
                </p>
              </article>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
