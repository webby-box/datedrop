import { Suspense } from "react";
import { AlertDetailClient } from "@/components/aura/alert-detail-client";
import { STATIC_ID_PARAMS } from "@/lib/static-mode";

export function generateStaticParams() {
  return STATIC_ID_PARAMS;
}

export const dynamicParams = true;

export default async function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <AlertDetailClient id={id} />
    </Suspense>
  );
}
