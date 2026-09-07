import { auth } from "@/auth";
import { googleAuthConfigured } from "@/lib/env";
import { ExploreClient } from "@/components/aura/explore-client";
import { LandingClient } from "@/components/aura/landing-client";

export default async function HomePage() {
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
