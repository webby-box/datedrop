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
      <div className="mx-auto max-w-xl py-8 md:py-12">
        <p className="kicker">Account</p>
        <h1 className="page-title serif mt-2 text-5xl">Settings</h1>

        <dl className="card-light mt-8 space-y-0 overflow-hidden rounded-[var(--radius-xl)] p-1">
          {[
            ["Email", user?.email || "not signed in"],
            ["User id", user?.userId || "—"],
            ["Mode", user?.demo ? "demo (Google OAuth keys missing)" : "Google"],
          ].map(([dt, dd], i) => (
            <div
              key={dt}
              className={`flex items-start justify-between gap-4 px-5 py-4 text-sm ${
                i ? "border-t border-[var(--line-soft)]" : ""
              }`}
            >
              <dt className="text-[var(--muted)]">{dt}</dt>
              <dd className="max-w-[60%] truncate text-right text-[var(--ink-soft)]">{dd}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 text-xs leading-relaxed text-[var(--muted)]">
          Stack: {env.placesProvider} · {env.llmProvider} · Env:{" "}
          {env.missing.length ? `missing ${env.missing.join(", ")}` : "all keys present"}.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href="/privacy" className="underline underline-offset-4 decoration-[var(--line-strong)] transition hover:text-[var(--ink)]">
            Privacy
          </Link>
          <Link href="/terms" className="underline underline-offset-4 decoration-[var(--line-strong)] transition hover:text-[var(--ink)]">
            Terms
          </Link>
          <Link href="/premium" className="underline underline-offset-4 decoration-[var(--line-strong)] transition hover:text-[var(--ink)]">
            Membership
          </Link>
        </div>
        <DeleteData />
      </div>
    </AppShell>
  );
}
