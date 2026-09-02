import { VaultDetailClient } from "@/components/aura/vault-detail-client";

export default async function VaultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VaultDetailClient id={decodeURIComponent(id)} />;
}
