"use client";

import { useSession } from "next-auth/react";
import { ExploreClient } from "./explore-client";
import { LandingClient } from "./landing-client";
import { Skeleton } from "./skeleton";

export function HomeGate({ authReady }: { authReady: boolean }) {
  const { status, data } = useSession();

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <Skeleton className="h-10 w-40 rounded-full" />
        <Skeleton className="mt-6 h-16 w-3/4 max-w-xl rounded-[var(--radius-lg)]" />
        <Skeleton className="mt-4 h-24 w-full max-w-lg rounded-[var(--radius-lg)]" />
      </div>
    );
  }

  if (data?.user) return <ExploreClient />;
  return <LandingClient authReady={authReady} />;
}
