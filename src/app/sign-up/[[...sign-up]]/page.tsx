import { SiteHeader } from "@/components/site-header";
import { clerkConfigured } from "@/lib/env";
import { AuthScreens } from "@/components/auth-screens";

export default function SignUpPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <AuthScreens mode="sign-up" ready={clerkConfigured()} />
    </div>
  );
}
