import { isStaticApp } from "@/lib/static-mode";
import { googleAuthConfigured } from "@/lib/env";
import { ExploreClient } from "@/components/aura/explore-client";
import { LandingClient } from "@/components/aura/landing-client";
import { HomeGate } from "@/components/static-home-gate";

export default async function HomePage() {
  if (isStaticApp) {
    return <HomeGate />;
  }
  const { auth } = await import("@/auth");
  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  if (session?.user) {
    return <ExploreClient />;
  }
  return <LandingClient authReady={googleAuthConfigured()} />;
}
