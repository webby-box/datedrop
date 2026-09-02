export const dynamic = "force-dynamic";

import { AppShell } from "@/components/aura/app-shell";
import { DeleteData } from "@/components/delete-data";
import { currentUserSafe } from "@/lib/auth";
import { getEnvStatus } from "@/lib/env";
import Link from "next/link";

export default async function SettingsPage() {
  const user = await currentUserSafe();
  const env = getEnvStatus();
  return (
    <AppShell>
      <div className="mx-auto max-w-xl py-10">
        <p className="kicker">Account</p>
        <h1 className="serif mt-2 text-5xl">Settings</h1>
        <dl className="mt-8 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[#6b6b6b]">Email</dt>
            <dd>{user?.email || "not signed in"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#6b6b6b]">User id</dt>
            <dd className="truncate text-[#2a2a2a]">{user?.userId || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#6b6b6b]">Mode</dt>
            <dd>{user?.demo ? "demo (Google OAuth keys missing)" : "Google"}</dd>
          </div>
        </dl>
        <p className="mt-8 text-xs text-[#6b6b6b]">
          Stack: {env.placesProvider} · {env.llmProvider} · Env:{" "}
          {env.missing.length ? `missing ${env.missing.join(", ")}` : "all keys present"}.
        </p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link href="/privacy" className="underline underline-offset-4">
            Privacy
          </Link>
          <Link href="/terms" className="underline underline-offset-4">
            Terms
          </Link>
          <Link href="/premium" className="underline underline-offset-4">
            Membership
          </Link>
        </div>
        <DeleteData />
      </div>
    </AppShell>
  );
}
