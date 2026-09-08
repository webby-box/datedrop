"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ExploreClient } from "@/components/aura/explore-client";
import { LandingClient } from "@/components/aura/landing-client";
import { isStaticDemo } from "@/lib/static-store";

export function HomeGate() {
  const { data } = useSession();
  const [demo, setDemo] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDemo(isStaticDemo());
    setReady(true);
  }, [data]);

  if (!ready) {
    return <LandingClient authReady={false} />;
  }
  if (data?.user || demo) return <ExploreClient />;
  return <LandingClient authReady={false} />;
}
