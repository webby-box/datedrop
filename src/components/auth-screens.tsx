"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";

export function AuthScreens({ ready }: { ready: boolean }) {
  if (!ready) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20">
        <p className="kicker">Google Sign-In</p>
        <h1 className="serif mt-3 text-4xl">Auth keys are not set</h1>
        <p className="mt-4 text-[#cfc3ae]">
          DateDrop still boots. Add <code className="text-[#d4a574]">AUTH_SECRET</code>{" "}
          (generate with <code className="text-[#d4a574]">openssl rand -base64 32</code>),{" "}
          <code className="text-[#d4a574]">AUTH_GOOGLE_ID</code>, and{" "}
          <code className="text-[#d4a574]">AUTH_GOOGLE_SECRET</code> to <code>.env.local</code>,
          then restart. Until then you can explore the inbox in demo mode.
        </p>
        <Link href="/inbox" className="mt-8 inline-block rounded-full bg-[#c45c26] px-5 py-3 text-sm">
          Continue to inbox
        </Link>
      </div>
    );
  }
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 py-20 text-center">
      <p className="kicker">Welcome</p>
      <h1 className="serif mt-3 text-4xl">Continue with Google</h1>
      <p className="mt-4 text-[#cfc3ae]">
        Sign in with your Google account to save captures and boards. No passwords — Google handles
        identity.
      </p>
      <button
        type="button"
        onClick={() => void signIn("google", { callbackUrl: "/inbox" })}
        className="mt-8 rounded-full bg-[#c45c26] px-6 py-3 text-sm font-medium text-[#f4ead5]"
      >
        Continue with Google
      </button>
    </div>
  );
}
