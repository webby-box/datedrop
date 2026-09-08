import { Suspense } from "react";
import { AppShell } from "@/components/aura/app-shell";
import { BoardClient } from "@/components/board-client";
import { getEnvStatus } from "@/lib/env";
import { STATIC_ID_PARAMS } from "@/lib/static-mode";

export function generateStaticParams() {
  return STATIC_ID_PARAMS;
}

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const env = getEnvStatus();
  return (
    <AppShell>
      <Suspense fallback={null}>
        <BoardClient id={id} attribution={env.attribution} />
      </Suspense>
    </AppShell>
  );
}
