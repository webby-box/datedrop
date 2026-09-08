"use client";

import { AppShell } from "@/components/aura/app-shell";
import { DeleteData } from "@/components/delete-data";
import { isStaticApp } from "@/lib/static-mode";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data } = useSession();
  const user = data?.user;
  return (
    <AppShell>
      <div className="mx-auto max-w-xl py-8 md:py-12">
        <p className="kicker">Account</p>
        <h1 className="page-title serif mt-2 text-5xl">Settings</h1>

        <dl className="card-light mt-8 space-y-0 overflow-hidden rounded-[var(--radius-xl)] p-1">
          {[
            ["Email", user?.email || "not signed in"],
            ["User id", user?.email || "—"],
            ["Mode", isStaticApp ? "GitHub Pages (browser-only demo)" : "Session"],
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
          {isStaticApp
            ? "This GitHub Pages build stores captures in localStorage. Live vision, MongoDB, and Google sign-in run on the Node host."
            : "Account details come from your current Auth.js session."}
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
