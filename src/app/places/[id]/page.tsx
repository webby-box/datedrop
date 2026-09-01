import { SiteHeader } from "@/components/site-header";
import { PlaceClient } from "@/components/place-client";
import { getEnvStatus } from "@/lib/env";

export default async function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const env = getEnvStatus();
  const attribution =
    env.placesProvider === "geoapify" ? "Powered by Geoapify" : undefined;
  return (
    <div className="min-h-screen">
      <SiteHeader signedIn />
      <PlaceClient id={id} attribution={attribution} />
    </div>
  );
}
