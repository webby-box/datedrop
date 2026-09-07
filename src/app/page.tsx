import { HomeGate } from "@/components/aura/home-gate";
import { googleAuthConfigured } from "@/lib/env";

export default function HomePage() {
  return <HomeGate authReady={googleAuthConfigured()} />;
}
