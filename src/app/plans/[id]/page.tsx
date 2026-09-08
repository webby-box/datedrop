import { Suspense } from "react";
import { PlanDetailClient } from "@/components/aura/plan-detail-client";
import { STATIC_ID_PARAMS } from "@/lib/static-mode";

export function generateStaticParams() {
  return STATIC_ID_PARAMS;
}

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <PlanDetailClient id={id} />
    </Suspense>
  );
}
