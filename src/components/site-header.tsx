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
    <header className="sticky top-0 z-30 border-b border-[rgba(17,17,17,0.06)] bg-[#f7f5f2]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <AuraBrand href={showAuthedNav ? "/explore" : "/"} />
        <nav className="flex items-center gap-4 text-sm text-[#6b6b6b]">
          <Link href="/privacy" className="hover:text-[#111]">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-[#111]">
            Terms
          </Link>
          {showAuthedNav ? (
            <>
              <Link href="/explore" className="hover:text-[#111]">
                Explore
              </Link>
              <Link href="/settings" className="hover:text-[#111]">
                Settings
              </Link>
              {authed && (
                <button
                  type="button"
                  onClick={() => void signOut({ callbackUrl: "/" })}
                  className="hover:text-[#111]"
                >
                  Sign out
                </button>
              )}
            </>
          ) : authReady ? (
            <Link
              href="/sign-in"
              className="rounded-full bg-black px-4 py-2 text-white"
            >
              Sign in
            </Link>
          ) : (
            <Link href="/sign-in" className="text-[#111]">
              Auth setup
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
