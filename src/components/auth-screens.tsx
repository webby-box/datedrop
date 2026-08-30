"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import Link from "next/link";

export function AuthScreens({ mode, ready }: { mode: "sign-in" | "sign-up"; ready: boolean }) {
  if (!ready) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20">
        <p className="kicker">Clerk</p>
        <h1 className="serif mt-3 text-4xl">Auth keys are not set</h1>
        <p className="mt-4 text-[#cfc3ae]">
          DateDrop still boots. Add <code className="text-[#d4a574]">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
          <code className="text-[#d4a574]">CLERK_SECRET_KEY</code> to <code>.env.local</code>, enable email + Google,
          then restart. Until then you can explore the inbox in demo mode.
        </p>
        <Link href="/inbox" className="mt-8 inline-block rounded-full bg-[#c45c26] px-5 py-3 text-sm">
          Continue to inbox
        </Link>
      </div>
    );
  }
  return (
    <div className="flex justify-center px-5 py-16">
      {mode === "sign-in" ? (
        <SignIn appearance={{ variables: { colorPrimary: "#c45c26" } }} />
      ) : (
        <SignUp appearance={{ variables: { colorPrimary: "#c45c26" } }} />
      )}
    </div>
  );
}
