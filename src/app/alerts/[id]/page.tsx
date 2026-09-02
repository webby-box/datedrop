import { AlertDetailClient } from "@/components/aura/alert-detail-client";

export default async function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AlertDetailClient id={id} />;
}
