"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

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
    <header className="sticky top-0 z-30 border-b border-[rgba(244,234,213,0.08)] bg-[#0c0b09]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href={showAuthedNav ? "/inbox" : "/"} className="flex items-baseline gap-2">
          <span className="serif text-2xl tracking-tight">DateDrop</span>
          <span className="hidden text-[11px] uppercase tracking-[0.2em] text-[#9a8f7e] sm:inline">
            drop · confirm · date
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-[#cfc3ae]">
          <Link href="/privacy" className="hover:text-[#f4ead5]">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-[#f4ead5]">
            Terms
          </Link>
          {showAuthedNav ? (
            <>
              <Link href="/inbox" className="hover:text-[#f4ead5]">
                Inbox
              </Link>
              <Link href="/settings" className="hover:text-[#f4ead5]">
                Settings
              </Link>
              {authed && session?.user?.email && (
                <span className="hidden max-w-[10rem] truncate text-[#9a8f7e] md:inline">
                  {session.user.email}
                </span>
              )}
              {authed && (
                <button
                  type="button"
                  onClick={() => void signOut({ callbackUrl: "/" })}
                  className="hover:text-[#f4ead5]"
                >
                  Sign out
                </button>
              )}
            </>
          ) : authReady ? (
            <Link
              href="/sign-in"
              className="rounded-full bg-[#c45c26] px-4 py-2 text-[#f4ead5]"
            >
              Sign in
            </Link>
          ) : (
            <Link href="/sign-in" className="text-[#d4a574]">
              Auth setup
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
