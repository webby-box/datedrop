import { SiteHeader } from "@/components/site-header";
import { googleAuthConfigured } from "@/lib/env";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader authReady={googleAuthConfigured()} />
      <article className="prose-legal mx-auto max-w-2xl px-5 py-14 md:py-16">
        <p className="kicker">Legal</p>
        <h1 className="serif-italic mt-3 text-5xl text-[var(--ink)]">Privacy</h1>
        <p className="mt-8">
          Aura Concierge Elite is a private vault for place screenshots. We are not a social network and we do
          not publish your captures.
        </p>
        <h2 className="serif mt-10 text-2xl">Screenshots</h2>
        <p className="mt-3">
          Images you upload are stored privately (Vercel Blob when configured, or a local demo
          folder if the blob token is missing). They are sent to a vision model solely to extract visible
          place names. You can delete your data from Settings.
        </p>
        <h2 className="serif mt-10 text-2xl">Places and maps</h2>
        <p className="mt-3">
          Place matching uses Geoapify, LocationIQ, or public Nominatim. Board maps use MapLibre GL with
          OpenFreeMap tiles. OpenStreetMap contributors; Powered by Geoapify when that provider is active.
        </p>
        <h2 className="serif mt-10 text-2xl">Reservations</h2>
        <p className="mt-3">
          We do not place reservations. We do not scrape Resy, OpenTable, Tock, or SevenRooms. Deep links
          open the provider site. Climate numbers come from the Open-Meteo 1991-2020 archive.
          Booking strategy / pose direction copy is generated from place metadata, not live inventory.
        </p>
        <h2 className="serif mt-10 text-2xl">Account</h2>
        <p className="mt-3">
          Sign-in is Google Sign-In (Auth.js). When OAuth keys are missing, the app runs in demo-local mode.
          Rate limit: 20 captures per hour.
        </p>
      </article>
    </div>
  );
}
