import { SiteHeader } from "@/components/site-header";
import { googleAuthConfigured } from "@/lib/env";

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader authReady={googleAuthConfigured()} />
      <article className="mx-auto max-w-2xl px-5 py-16 text-[#cfc3ae]">
        <p className="kicker">Legal</p>
        <h1 className="serif mt-3 text-5xl text-[#f4ead5]">Terms</h1>
        <p className="mt-8">
          DateDrop helps you turn screenshots into confirmed Google Places and then into a date
          plan. It is not a travel super-app, not a booking engine, and not a table-sniping tool.
        </p>
        <h2 className="serif mt-10 text-2xl text-[#f4ead5]">What we do</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Read screenshots you upload (Maps, social overlays, booking app screens, postcards).</li>
          <li>Parse public Maps and venue URLs you paste. We do not fetch live slot grids.</li>
          <li>Ask you to confirm a Google Place match before anything is saved.</li>
          <li>Group saved places on a board by city and generate an itinerary from your places.</li>
          <li>Hand you outbound booking links. You book on the provider site.</li>
        </ul>
        <h2 className="serif mt-10 text-2xl text-[#f4ead5]">What we do not do</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Place reservations on your behalf.</li>
          <li>Show fake time slots or live availability.</li>
          <li>Call unofficial APIs such as api.resy.com.</li>
          <li>Scrape Instagram, TikTok, Resy, or OpenTable.</li>
          <li>Sell flights, hotels, or payments.</li>
        </ul>
        <h2 className="serif mt-10 text-2xl text-[#f4ead5]">Attribution</h2>
        <p className="mt-3">
          Place data and maps: Google Maps Platform. Climate normals: Open-Meteo archive 1991–2020.
          Vision: Gemini 2.5 Flash. Use of those services is subject to their own terms.
        </p>
      </article>
    </div>
  );
}
