import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="px-5 py-24 text-center">
        <p className="kicker">404</p>
        <h1 className="serif mt-2 text-5xl">That pin isn&apos;t on the map</h1>
        <Link href="/" className="mt-6 inline-block text-[#d4a574]">
          Back to DateDrop
        </Link>
      </div>
    </div>
  );
}
