import { SiteHeader } from "@/components/site-header";
import { BoardClient } from "@/components/board-client";
import { getEnvStatus } from "@/lib/env";

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const env = getEnvStatus();
  const attribution =
    env.placesProvider === "geoapify" ? "Powered by Geoapify" : undefined;
  return (
    <div className="min-h-screen">
      <SiteHeader signedIn />
      <BoardClient id={id} attribution={attribution} />
    </div>
  );
}
