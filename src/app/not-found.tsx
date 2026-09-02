import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="px-5 py-24 text-center md:py-32">
        <p className="kicker">404</p>
        <h1 className="serif-italic mt-3 text-5xl leading-tight">That pin isn&apos;t on the map</h1>
        <Link
          href="/"
          className="focus-ring mt-8 inline-flex min-h-[44px] items-center rounded-full bg-[var(--ink)] px-5 text-[11px] uppercase tracking-[0.16em] text-white transition hover:bg-black"
        >
          Back to Aura
        </Link>
      </div>
    </div>
  );
}
