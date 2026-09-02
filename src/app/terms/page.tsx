import { SiteHeader } from "@/components/site-header";
import { googleAuthConfigured } from "@/lib/env";

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader authReady={googleAuthConfigured()} />
      <article className="mx-auto max-w-2xl px-5 py-16 text-[#2a2a2a]">
        <p className="kicker">Legal</p>
        <h1 className="serif-italic mt-3 text-5xl text-[#111]">Terms</h1>
        <p className="mt-8">
          Aura Concierge Elite helps you turn screenshots into confirmed places, vault logistics, and date
          plans. It is not a booking engine or table-sniping tool.
        </p>
        <h2 className="serif mt-10 text-2xl text-[#111]">What we do</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Read screenshots you upload and parse public Maps / venue URLs.</li>
          <li>Ask you to confirm a place match before anything is saved to The Vault.</li>
          <li>Generate proactive alerts from vault dates and place metadata.</li>
          <li>Compose booking strategy, pose direction, and optimal setting via LLM from metadata.</li>
          <li>Hand you outbound booking links. You book on the provider site.</li>
        </ul>
        <h2 className="serif mt-10 text-2xl text-[#111]">What we do not do</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Place reservations on your behalf.</li>
          <li>Show fake time slots or live availability.</li>
          <li>Call unofficial APIs such as api.resy.com.</li>
          <li>Scrape Instagram, TikTok, Resy, or OpenTable.</li>
          <li>Process payments (Premium is UX polish / future stubs only).</li>
        </ul>
        <h2 className="serif mt-10 text-2xl text-[#111]">Attribution</h2>
        <p className="mt-3">
          Place data: OpenStreetMap via Geoapify, LocationIQ, or Nominatim. Maps: MapLibre + OpenFreeMap.
          Climate: Open-Meteo archive 1991-2020. Vision / chat: Groq, OpenRouter, or Gemini.
        </p>
      </article>
    </div>
  );
}
