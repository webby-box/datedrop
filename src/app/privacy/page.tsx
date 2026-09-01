import { SiteHeader } from "@/components/site-header";
import { googleAuthConfigured } from "@/lib/env";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader authReady={googleAuthConfigured()} />
      <article className="mx-auto max-w-2xl px-5 py-16 text-[#cfc3ae]">
        <p className="kicker">Legal</p>
        <h1 className="serif mt-3 text-5xl text-[#f4ead5]">Privacy</h1>
        <p className="mt-8">
          DateDrop is a private inbox for place screenshots. We are not a social network and we do
          not publish your captures.
        </p>
        <h2 className="serif mt-10 text-2xl text-[#f4ead5]">Screenshots</h2>
        <p className="mt-3">
          Images you upload are stored privately (Vercel Blob when configured, or a local demo
          folder if the blob token is missing). They are sent to Google Gemini solely to extract
          visible place names. We do not run public screenshot pages. You can delete your data
          from Settings.
        </p>
        <h2 className="serif mt-10 text-2xl text-[#f4ead5]">Google Maps Platform</h2>
        <p className="mt-3">
          Place matching uses the Google Places API (New) — Text Search, Place Details, and Nearby
          Search — with field masks. We store <code>place_id</code> values so we can refresh
          details after seven days without guessing. Maps on boards use the Google Maps JavaScript
          API. Google Maps Platform terms and attribution apply. This product uses Google Maps
          Platform APIs; we are not affiliated with Google beyond that licensed use.
        </p>
        <h2 className="serif mt-10 text-2xl text-[#f4ead5]">Reservations</h2>
        <p className="mt-3">
          We do not place reservations. We do not scrape Resy, OpenTable, Tock, or SevenRooms. We
          do not call unofficial booking APIs. Deep links open the provider&apos;s site with a date
          and party size when the public URL allows it. Climate numbers come from the Open-Meteo
          1991–2020 archive.
        </p>
        <h2 className="serif mt-10 text-2xl text-[#f4ead5]">Account</h2>
        <p className="mt-3">
          Sign-in is handled by Google Sign-In (Auth.js). We store your Google user id (sub) and
          email so boards stay yours. Rate limit: 20 captures per hour.
        </p>
      </article>
    </div>
  );
}
