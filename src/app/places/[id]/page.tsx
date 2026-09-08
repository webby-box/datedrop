import { Suspense } from "react";
import { AppShell } from "@/components/aura/app-shell";
import { PlaceClient } from "@/components/place-client";
import { getEnvStatus } from "@/lib/env";
import { STATIC_ID_PARAMS } from "@/lib/static-mode";

export function generateStaticParams() {
  return STATIC_ID_PARAMS;
}

export const dynamicParams = true;

export default async function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const env = getEnvStatus();
  const attribution =
    env.placesProvider === "geoapify" ? "Powered by Geoapify" : undefined;
  return (
    <AppShell>
      <Suspense fallback={null}>
        <PlaceClient id={id} attribution={attribution} />
      </Suspense>
    </AppShell>
  );
}
