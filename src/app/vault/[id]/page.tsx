import { Suspense } from "react";
import { VaultDetailClient } from "@/components/aura/vault-detail-client";
import { STATIC_ID_PARAMS } from "@/lib/static-mode";

export function generateStaticParams() {
  return STATIC_ID_PARAMS;
}

export const dynamicParams = true;

export default async function VaultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <VaultDetailClient id={decodeURIComponent(id)} />
    </Suspense>
  );
}
