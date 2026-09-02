"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { AuraBrand } from "@/components/aura/brand";

export function SiteHeader({
  signedIn,
  authReady,
}: {
  signedIn?: boolean;
  authReady?: boolean;
}) {
  const { data: session } = useSession();
  const authed = Boolean(session?.user);
  const showAuthedNav = signedIn || authed;

  return (
    <header
      className="sticky top-0 z-30 border-b border-[var(--line-soft)] bg-[var(--bg)]/90 backdrop-blur-md"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 md:px-6">
        <AuraBrand href={showAuthedNav ? "/" : "/"} />
        <nav className="flex items-center gap-3 text-sm text-[var(--muted)] md:gap-4">
          <Link href="/privacy" className="transition hover:text-[var(--ink)]">
            Privacy
          </Link>
          <Link href="/terms" className="transition hover:text-[var(--ink)]">
            Terms
          </Link>
          {showAuthedNav ? (
            <>
              <Link href="/" className="transition hover:text-[var(--ink)]">
                Explore
              </Link>
              <Link href="/settings" className="transition hover:text-[var(--ink)]">
                Settings
              </Link>
              {authed && (
                <button
                  type="button"
                  onClick={() => void signOut({ callbackUrl: "/" })}
                  className="transition hover:text-[var(--ink)]"
                >
                  Sign out
                </button>
              )}
            </>
          ) : authReady ? (
            <Link
              href="/sign-in"
              className="focus-ring rounded-full bg-[var(--ink)] px-4 py-2 text-white transition hover:bg-black"
            >
              Sign in
            </Link>
          ) : (
            <Link href="/sign-in" className="text-[var(--ink)] transition hover:opacity-80">
              Auth setup
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
