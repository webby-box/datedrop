import { SiteHeader } from "@/components/site-header";
import { CaptureConfirm } from "@/components/capture-confirm";

export default async function CapturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="min-h-screen">
      <SiteHeader signedIn />
      <CaptureConfirm id={id} />
    </div>
  );
}
