import { Suspense } from "react";
import { AppShell } from "@/components/aura/app-shell";
import { PlanClient } from "@/components/plan-client";
import { STATIC_ID_PARAMS } from "@/lib/static-mode";

export function generateStaticParams() {
  return STATIC_ID_PARAMS;
}

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell>
      <Suspense fallback={null}>
        <PlanClient id={id} />
      </Suspense>
    </AppShell>
  );
}
