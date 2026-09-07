"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { occasionLabel } from "@/lib/occasions";

export type VaultItem = {
  placeId: string;
  name: string;
  address: string;
  city: string;
  rating?: number;
  primaryType?: string;
  bookingPlatform?: string;
  imageUrl?: string;
  status?: string;
  occasion?: string;
};

function gradientFor(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const palettes = [
    "from-[#d9cfc4] to-[#8a7f74]",
    "from-[#cfd6dc] to-[#6d7884]",
    "from-[#dccfc6] to-[#7a6558]",
    "from-[#c8d0c6] to-[#5f6b5e]",
  ];
  return palettes[n % palettes.length];
}

export function VaultCard({ item }: { item: VaultItem }) {
  const rare =
    (item.rating || 0) >= 4.4 ||
    ["resy", "opentable", "tock"].includes(item.bookingPlatform || "");
  return (
    <Link
      href={`/vault/${encodeURIComponent(item.placeId)}`}
      className="card-light card-interactive group fade-up overflow-hidden rounded-[var(--radius-xl)]"
    >
      <div className={cn("relative aspect-[4/3] bg-gradient-to-br", gradientFor(item.placeId))}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
        ) : null}
        {rare ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white backdrop-blur">
            <Sparkles className="h-3 w-3" /> Rare
          </span>
        ) : null}
      </div>
      <div className="p-4 md:p-5">
        <p className="kicker">{item.city}</p>
        <h3 className="serif-italic mt-1.5 text-2xl leading-tight text-[var(--ink)]">{item.name}</h3>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">{item.address}</p>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {item.rating ? <span className="chip">★ {item.rating.toFixed(1)}</span> : null}
          {item.primaryType ? (
            <span className="chip">{item.primaryType.replace(/_/g, " ")}</span>
          ) : null}
          {occasionLabel(item.occasion) ? <span className="chip">{occasionLabel(item.occasion)}</span> : null}
        </div>
      </div>
    </Link>
  );
}
