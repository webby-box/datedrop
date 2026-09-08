"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "./app-shell";
import { Skeleton } from "./skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useRouteId } from "@/lib/use-route-id";
import { vaultHref, planHref } from "@/lib/static-mode";

type Payload = {
  alert: {
    _id: string;
    title: string;
    subtitle: string;
    body: string;
    why: string;
    placeName?: string;
    address?: string;
    kind: string;
    suggestedDates?: { start?: string; end?: string };
  };
  place?: { id: string; name: string } | null;
  board?: { _id: string; city: string } | null;
  logistics?: { bookingStrategy: string; poseDirection: string; optimalSetting: string } | null;
  booking?: { url: string; label: string } | null;
  screenshot?: string;
};

export function AlertDetailClient({ id: paramId }: { id: string }) {
  const id = useRouteId(paramId);
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/alerts/${id}`);
      const json = await res.json();
      if (!res.ok) {
        setErr(json.error || "Not found");
        return;
      }
      setData(json);
    })();
  }, [id]);

  return (
    <AppShell live>
      <div className="py-6 md:py-10">
        <Link href="/" className="back-link">
          <ArrowLeft className="h-3.5 w-3.5" /> Explore
        </Link>

        {err ? (
          <p className="mt-8 text-[var(--skip)]">{err}</p>
        ) : !data ? (
          <div className="mt-8 space-y-4">
            <Skeleton className="h-56 w-full rounded-[var(--radius-xl)]" />
            <Skeleton className="h-40 w-full rounded-[var(--radius-xl)]" />
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="card-dark overflow-hidden rounded-[var(--radius-xl)]">
              <div className="relative min-h-[240px] bg-gradient-to-br from-[#2a2420] to-[#0e0c0b] p-6 md:min-h-[320px] md:p-8">
                {data.screenshot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.screenshot} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
                ) : null}
                <div className="relative z-10 flex h-full min-h-[200px] flex-col justify-end md:min-h-[280px]">
                  <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white">
                    {data.alert.title}
                  </span>
                  <h1 className="serif-italic mt-4 text-4xl text-white md:text-5xl">
                    {data.alert.placeName || data.alert.subtitle}
                  </h1>
                  <p className="mt-3 max-w-xl text-sm text-white/70">{data.alert.body}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <article className="card-light rounded-[var(--radius-lg)] p-5">
                <p className="kicker">Why this alert</p>
                <p className="mt-3 text-sm leading-relaxed">{data.alert.why}</p>
                {data.alert.suggestedDates?.start ? (
                  <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                    Suggested · {data.alert.suggestedDates.start}
                    {data.alert.suggestedDates.end ? ` → ${data.alert.suggestedDates.end}` : ""}
                  </p>
                ) : null}
              </article>

              {data.logistics ? (
                <>
                  <article className="card-light rounded-[var(--radius-lg)] p-5">
                    <p className="kicker">Booking strategy</p>
                    <p className="mt-3 text-sm leading-relaxed">{data.logistics.bookingStrategy}</p>
                  </article>
                  <article className="card-light rounded-[var(--radius-lg)] p-5">
                    <p className="kicker">Pose direction</p>
                    <p className="mt-3 text-sm leading-relaxed">{data.logistics.poseDirection}</p>
                  </article>
                  <article className="card-light rounded-[var(--radius-lg)] p-5">
                    <p className="kicker">Optimal setting</p>
                    <p className="mt-3 text-sm leading-relaxed">{data.logistics.optimalSetting}</p>
                  </article>
                </>
              ) : null}

              <div className="flex flex-wrap gap-3">
                {data.booking ? (
                  <Button asChild>
                    <a href={data.booking.url} target="_blank" rel="noreferrer">
                      {data.booking.label} <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                ) : null}
                {data.place?.id ? (
                  <Button variant="outline" asChild>
                    <Link href={vaultHref(data.place.id)}>View in vault</Link>
                  </Button>
                ) : null}
                {data.board?._id ? (
                  <Button variant="outline" asChild>
                    <Link href={planHref(data.board._id)}>View plan</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
