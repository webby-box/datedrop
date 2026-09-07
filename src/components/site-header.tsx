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
      className="sticky top-0 z-30 bg-[var(--header)] text-[#f7f2e9]"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 md:px-6">
        <AuraBrand inverted href="/" />
        <nav className="flex items-center gap-3 text-sm text-[#f7f2e9]/70 md:gap-4">
          <Link href="/privacy" className="transition hover:text-[var(--gold)]">
            Privacy
          </Link>
          <Link href="/terms" className="transition hover:text-[var(--gold)]">
            Terms
          </Link>
          {showAuthedNav ? (
            <>
              <Link href="/" className="transition hover:text-[var(--gold)]">
                Explore
              </Link>
              <Link href="/settings" className="transition hover:text-[var(--gold)]">
                Settings
              </Link>
              {authed && (
                <button
                  type="button"
                  onClick={() => void signOut({ callbackUrl: "/" })}
                  className="transition hover:text-[var(--gold)]"
                >
                  Sign out
                </button>
              )}
            </>
          ) : authReady ? (
            <Link
              href="/sign-in"
              className="focus-ring rounded-full bg-[var(--gold)] px-4 py-2 text-[var(--ink)] transition hover:bg-[#c9a97a]"
            >
              Sign in
            </Link>
          ) : (
            <Link href="/sign-in" className="text-[var(--gold)] transition hover:opacity-80">
              Auth setup
            </Link>
          )}
        </nav>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
    </header>
  );
}
