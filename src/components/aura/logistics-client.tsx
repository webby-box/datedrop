"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Payload = {
  alert: {
    title: string;
    subtitle: string;
    body: string;
    why: string;
    suggestedDates?: { start?: string; end?: string };
    placeName?: string;
    address?: string;
  };
  place: { name: string; formattedAddress: string } | null;
  board: { _id: string; title: string } | null;
  logistics: {
    bookingStrategy: string;
    poseDirection: string;
    optimalSetting: string;
  } | null;
  booking: { url: string; label: string } | null;
  screenshot?: string;
};

export function LogisticsClient({ id }: { id: string }) {
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

  if (err) return <p className="py-16 text-[#8b3a2f]">{err}</p>;
  if (!data) {
    return (
      <div className="py-10">
        <div className="skeleton h-56 rounded-3xl" />
        <div className="skeleton mt-4 h-8 w-2/3 rounded-full" />
      </div>
    );
  }

  const name = data.place?.name || data.alert.placeName || data.alert.subtitle;
  const address = data.place?.formattedAddress || data.alert.address || "";

  return (
    <div className="fade-up mx-auto max-w-2xl py-6 md:py-10">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/explore" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(17,17,17,0.1)] bg-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(17,17,17,0.1)] bg-white"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied");
            } catch {
              toast.message(window.location.href);
            }
          }}
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl bg-[#1a1a1a]">
        {data.screenshot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.screenshot} alt="" className="h-56 w-full object-cover opacity-90 md:h-72" />
        ) : (
          <div className="flex h-56 items-end bg-gradient-to-br from-[#2c2c2c] to-[#111] p-6 md:h-72">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/50">{data.alert.title}</p>
          </div>
        )}
      </div>

      <p className="kicker mt-6">{data.alert.title}</p>
      <h1 className="serif-italic mt-2 text-4xl md:text-5xl">{name}</h1>
      <p className="mt-2 text-sm text-[#6b6b6b]">{address}</p>
      <p className="mt-4 text-sm leading-relaxed text-[#2a2a2a]">{data.alert.body}</p>

      <div className="mt-10 space-y-8">
        <section>
          <p className="kicker">Booking strategy</p>
          <p className="mt-3 text-sm leading-relaxed text-[#2a2a2a]">
            {data.logistics?.bookingStrategy || "Open the booking site for typical release windows. Aura never holds inventory."}
          </p>
        </section>
        <section>
          <p className="kicker">Pose direction</p>
          <p className="mt-3 text-sm leading-relaxed text-[#2a2a2a]">
            {data.logistics?.poseDirection || "Soft available light; editorial table vignette."}
          </p>
        </section>
        <section>
          <p className="kicker">Optimal setting</p>
          <p className="mt-3 text-sm leading-relaxed text-[#2a2a2a]">
            {data.logistics?.optimalSetting || "Party of two, early evening."}
          </p>
        </section>
        <section className="card-light rounded-3xl p-5">
          <p className="kicker">Why this alert</p>
          <p className="mt-2 text-sm text-[#2a2a2a]">{data.alert.why}</p>
          {data.alert.suggestedDates?.start && (
            <p className="mt-2 text-xs text-[#6b6b6b]">
              Suggested dates: {data.alert.suggestedDates.start}
              {data.alert.suggestedDates.end ? ` → ${data.alert.suggestedDates.end}` : ""}
            </p>
          )}
        </section>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {data.booking && (
          <a
            href={data.booking.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-black text-sm text-white"
          >
            {data.booking.label}
          </a>
        )}
        {data.board && (
          <Link href={`/boards/${data.board._id}/plan`} className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-[rgba(17,17,17,0.12)] text-sm">
            Draft plan
          </Link>
        )}
      </div>
      <Button asChild variant="ghost" className="mt-3 w-full">
        <Link href="/concierge">Ask Aura about this</Link>
      </Button>
    </div>
  );
}
