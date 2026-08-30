import { SiteHeader } from "@/components/site-header";
import { PlaceClient } from "@/components/place-client";

export default async function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="min-h-screen">
      <SiteHeader signedIn />
      <PlaceClient id={id} mapsKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY} />
    </div>
  );
}
