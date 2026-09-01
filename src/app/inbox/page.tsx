import { SiteHeader } from "@/components/site-header";
import { InboxClient } from "@/components/inbox-client";
import { getEnvStatus, googleAuthConfigured } from "@/lib/env";

export default function InboxPage() {
  const env = getEnvStatus();
  return (
    <div className="min-h-screen">
      <SiteHeader signedIn authReady={googleAuthConfigured()} />
      {!googleAuthConfigured() && (
        <div className="border-b border-[rgba(212,165,116,0.25)] bg-[#1a1712] px-5 py-3 text-sm text-[#d4a574]">
          Google OAuth keys missing — demo mode. Auth screens explain how to wire Google Sign-In.
        </div>
      )}
      {env.missing.length > 0 && (
        <div className="border-b border-[rgba(244,234,213,0.08)] px-5 py-2 text-xs text-[#9a8f7e]">
          Optional keys not set: {env.missing.join(", ")}. Features degrade with readable errors.
        </div>
      )}
      <InboxClient />
    </div>
  );
}
