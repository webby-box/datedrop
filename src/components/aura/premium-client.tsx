"use client";

import Link from "next/link";
import { AppShell } from "./app-shell";
import { Check } from "lucide-react";

const PERKS = [
  "Unlimited vault captures & confirmations",
  "Proactive booking-window alerts (14–30d)",
  "LLM logistics: booking strategy, pose, setting",
  "Plan itineraries with Open-Meteo climate",
  "Aura concierge chat with vault context",
  "MapLibre vault pin map",
  "Markdown plan export",
  "Taste-profile preference matching",
];

export function PremiumClient() {
  return (
    <AppShell>
      <div className="py-8 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="kicker">Membership</p>
            <h1 className="serif mt-3 text-5xl tracking-tight md:text-6xl">
              Concierge Elite
              <span className="serif-italic block text-[#6b6b6b]">— complimentary</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#6b6b6b]">
              Every Aura feature is unlocked. No payments, no paywall. We identify places and open
              booking sites — we never hold live inventory or scrape Resy.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/capture"
                className="inline-flex min-h-[48px] items-center rounded-full bg-black px-6 text-sm font-medium text-white"
              >
                Start capturing
              </Link>
              <Link
                href="/concierge"
                className="inline-flex min-h-[48px] items-center rounded-full border border-[rgba(17,17,17,0.16)] px-6 text-sm"
              >
                Ask Aura
              </Link>
            </div>
          </div>

          <div className="card-dark rounded-[32px] p-7 md:p-9">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/50">Included</p>
            <p className="serif-italic mt-3 text-4xl text-white">$0 / forever</p>
            <ul className="mt-8 space-y-3">
              {PERKS.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-white/85">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <Check className="h-3 w-3" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
