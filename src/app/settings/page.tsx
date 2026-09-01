import { SiteHeader } from "@/components/site-header";
import { DeleteData } from "@/components/delete-data";
import { currentUserSafe } from "@/lib/auth";
import { getEnvStatus, googleAuthConfigured } from "@/lib/env";

export default async function SettingsPage() {
  const user = await currentUserSafe();
  const env = getEnvStatus();
  return (
    <div className="min-h-screen">
      <SiteHeader signedIn authReady={googleAuthConfigured()} />
      <div className="mx-auto max-w-xl px-5 py-12">
        <p className="kicker">Account</p>
        <h1 className="serif mt-2 text-5xl">Settings</h1>
        <dl className="mt-8 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[#9a8f7e]">Email</dt>
            <dd>{user?.email || "not signed in"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#9a8f7e]">User id</dt>
            <dd className="truncate text-[#d4a574]">{user?.userId || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#9a8f7e]">Mode</dt>
            <dd>{user?.demo ? "demo (Google OAuth keys missing)" : "Google"}</dd>
          </div>
        </dl>
        <p className="mt-8 text-xs text-[#9a8f7e]">
          Env: {env.missing.length ? `missing ${env.missing.join(", ")}` : "all keys present"}.
        </p>
        <DeleteData />
      </div>
    </div>
  );
}
