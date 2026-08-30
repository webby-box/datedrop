import { SiteHeader } from "@/components/site-header";
import { PlanClient } from "@/components/plan-client";

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="min-h-screen">
      <SiteHeader signedIn />
      <PlanClient id={id} />
    </div>
  );
}
