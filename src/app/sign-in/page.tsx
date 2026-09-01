import { SiteHeader } from "@/components/site-header";
import { googleAuthConfigured } from "@/lib/env";
import { AuthScreens } from "@/components/auth-screens";

export default function SignInPage() {
  const ready = googleAuthConfigured();
  return (
    <div className="min-h-screen">
      <SiteHeader authReady={ready} />
      <AuthScreens ready={ready} />
    </div>
  );
}
