import Link from "next/link";
import { Check, Star } from "lucide-react";

const FEATURES = [
  "Priority proactive alerts across every vault city",
  "Richer booking strategy & pose direction copy",
  "Unlimited taste profiles",
  "Concierge chat with full vault context",
  "Early access to multi-city itineraries",
  "Future: shared plans with a guest (stub)",
];

export function PremiumPage() {
  return (
    <div className="fade-up py-6 md:py-10">
      <p className="kicker">Membership</p>
      <h1 className="serif-italic mt-2 text-4xl md:text-5xl">Premium</h1>
      <p className="mt-3 max-w-xl text-sm text-[#6b6b6b]">
        Aura stays fully usable free. Premium is polish and future gates — no payment integration yet.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card-dark rounded-[2rem] p-8 md:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white">
            <Star className="h-3 w-3" /> Concierge Elite
          </div>
          <h2 className="serif-italic mt-6 text-4xl text-white">Move through the city with intention</h2>
          <p className="mt-4 text-sm leading-relaxed text-white/65">
            The free tier already captures, vaults, plans, and alerts. Premium will deepen the editorial layer —
            denser logistics, quieter UI chrome, and gated experiments. No Stripe checkout here.
          </p>
          <button
            type="button"
            disabled
            className="mt-8 inline-flex h-12 items-center rounded-full bg-white px-6 text-sm font-medium text-black opacity-80"
          >
            Coming soon
          </button>
        </div>
        <ul className="card-light space-y-4 rounded-[2rem] p-8">
          {FEATURES.map((f) => (
            <li key={f} className="flex gap-3 text-sm text-[#2a2a2a]">
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
              {f}
            </li>
          ))}
          <li className="pt-4 text-xs text-[#6b6b6b]">
            Continue on free → <Link href="/explore" className="underline">Explore</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
