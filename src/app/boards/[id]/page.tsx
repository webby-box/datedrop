import { SiteHeader } from "@/components/site-header";
import { BoardClient } from "@/components/board-client";

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="min-h-screen">
      <SiteHeader signedIn />
      <BoardClient id={id} mapsKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY} />
    </div>
  );
}
