import { Suspense } from "react";
import { AppShell } from "@/components/aura/app-shell";
import { CaptureConfirm } from "@/components/capture-confirm";
import { STATIC_ID_PARAMS } from "@/lib/static-mode";

export function generateStaticParams() {
  return STATIC_ID_PARAMS;
}

export const dynamicParams = true;

export default async function CapturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell>
      <Suspense fallback={null}>
        <CaptureConfirm id={id} />
      </Suspense>
    </AppShell>
  );
}
