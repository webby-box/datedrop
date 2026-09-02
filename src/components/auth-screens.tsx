"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export function AuthScreens({ ready }: { ready: boolean }) {
  const [demoBusy, setDemoBusy] = useState(false);

  async function enterDemo() {
    setDemoBusy(true);
    try {
      await signIn("demo", { callbackUrl: "/" });
    } finally {
      setDemoBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20">
        <p className="kicker">Google Sign-In</p>
        <h1 className="serif mt-3 text-4xl">Auth keys are not set</h1>
        <p className="mt-4 text-[#6b6b6b]">
          Aura still boots in demo mode. Add <code className="text-[#111]">AUTH_SECRET</code>{" "}
          (generate with <code className="text-[#111]">openssl rand -base64 32</code>),{" "}
          <code className="text-[#111]">AUTH_GOOGLE_ID</code>, and{" "}
          <code className="text-[#111]">AUTH_GOOGLE_SECRET</code> to <code>.env.local</code>,
          then restart.
        </p>
        <button
          type="button"
          onClick={() => void enterDemo()}
          disabled={demoBusy}
          className="mt-8 inline-block rounded-full bg-black px-5 py-3 text-sm text-white disabled:opacity-60"
        >
          {demoBusy ? "Entering…" : "Continue to Explore"}
        </button>
        <Link href="/" className="mt-4 block text-sm text-[#6b6b6b]">
          Or open Explore directly
        </Link>
      </div>
    );
  }
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 py-20 text-center">
      <p className="kicker">Welcome</p>
      <h1 className="serif mt-3 text-4xl">Continue with Google</h1>
      <p className="mt-4 text-[#6b6b6b]">
        Sign in to save captures to The Vault and receive proactive alerts. No passwords — Google
        handles identity.
      </p>
      <button
        type="button"
        onClick={() => void signIn("google", { callbackUrl: "/" })}
        className="mt-8 rounded-full bg-black px-6 py-3 text-sm font-medium text-white"
      >
        Continue with Google
      </button>
      <button
        type="button"
        onClick={() => void enterDemo()}
        disabled={demoBusy}
        className="mt-3 rounded-full border border-[rgba(17,17,17,0.12)] bg-white px-6 py-3 text-sm font-medium text-[#111] disabled:opacity-60"
      >
        {demoBusy ? "Entering…" : "Continue as demo"}
      </button>
      <p className="mt-3 text-xs text-[#6b6b6b]">
        Demo uses a local guest session — fine for trying Capture, Vault, Plans, and Concierge.
      </p>
    </div>
  );
}
