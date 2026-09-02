import { AppShell } from "@/components/aura/app-shell";
import { CaptureConfirm } from "@/components/capture-confirm";

export default async function CapturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell>
      <CaptureConfirm id={id} />
    </AppShell>
  );
}
