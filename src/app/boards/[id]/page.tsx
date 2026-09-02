import { AppShell } from "@/components/aura/app-shell";
import { BoardClient } from "@/components/board-client";
import { getEnvStatus } from "@/lib/env";

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const env = getEnvStatus();
  return (
    <AppShell>
      <BoardClient id={id} attribution={env.attribution} />
    </AppShell>
  );
}
