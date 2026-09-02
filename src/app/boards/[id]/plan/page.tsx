import { AppShell } from "@/components/aura/app-shell";
import { PlanClient } from "@/components/plan-client";

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell>
      <PlanClient id={id} />
    </AppShell>
  );
}
