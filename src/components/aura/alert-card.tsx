"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertCardData = {
  _id: string;
  kind: string;
  title: string;
  subtitle: string;
  body: string;
  placeName?: string;
  address?: string;
  imageUrl?: string;
  why?: string;
  read?: boolean;
};

const gradients = [
  "from-[#2a2420] via-[#1a1614] to-[#0e0c0b]",
  "from-[#1f2428] via-[#14181c] to-[#0b0d10]",
  "from-[#24201f] via-[#181412] to-[#0c0a09]",
];

export function AlertCard({ alert, className }: { alert: AlertCardData; className?: string }) {
  const g = gradients[alert._id.charCodeAt(alert._id.length - 1) % gradients.length];
  return (
    <Link
      href={`/alerts/${alert._id}`}
      className={cn(
        "card-dark fade-up group relative block overflow-hidden rounded-[var(--radius-xl)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-dark)]",
        className,
      )}
    >
      <div className={cn("relative min-h-[220px] bg-gradient-to-br p-5 md:min-h-[260px] md:p-6", g)}>
        {alert.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={alert.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-luminosity transition duration-500 group-hover:opacity-45 group-hover:scale-[1.02]"
          />
        ) : null}
        <div className="relative z-10 flex h-full min-h-[190px] flex-col justify-between md:min-h-[220px]">
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white backdrop-blur">
              <Sparkles className="h-3 w-3" />
              {alert.title}
            </span>
            {!alert.read ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-black">
                <span className="live-dot !bg-black !shadow-none" /> Live
              </span>
            ) : null}
          </div>
          <div>
            <h3 className="serif-italic text-3xl leading-[1.1] text-white md:text-4xl">
              {alert.placeName || alert.subtitle}
            </h3>
            <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-white/70">{alert.body}</p>
            <p className="mt-5 text-[10px] font-medium uppercase tracking-[0.22em] text-white/50 transition group-hover:text-white/70">
              View logistics →
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
