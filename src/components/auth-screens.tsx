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
      <div className="mx-auto max-w-lg px-5 py-20 md:py-24">
        <p className="kicker">Google Sign-In</p>
        <h1 className="page-title serif mt-3 text-4xl md:text-5xl">Auth keys are not set</h1>
        <p className="page-lead mt-4">
          Aura still boots in demo mode. Add <code className="text-[var(--ink)]">AUTH_SECRET</code>{" "}
          (generate with <code className="text-[var(--ink)]">openssl rand -base64 32</code>),{" "}
          <code className="text-[var(--ink)]">AUTH_GOOGLE_ID</code>, and{" "}
          <code className="text-[var(--ink)]">AUTH_GOOGLE_SECRET</code> to <code>.env.local</code>,
          then restart.
        </p>
        <button
          type="button"
          onClick={() => void enterDemo()}
          disabled={demoBusy}
          className="focus-ring mt-8 inline-flex min-h-[48px] items-center rounded-full bg-[var(--ink)] px-5 text-sm text-white transition hover:bg-black disabled:opacity-60"
        >
          {demoBusy ? "Entering…" : "Continue to Explore"}
        </button>
        <Link href="/" className="mt-4 block text-sm text-[var(--muted)] transition hover:text-[var(--ink)]">
          Or open Explore directly
        </Link>
      </div>
    );
  }
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 py-20 text-center md:py-24">
      <p className="kicker">Welcome</p>
      <h1 className="page-title serif mt-3 text-4xl md:text-5xl">Continue with Google</h1>
      <p className="page-lead mt-4">
        Sign in to save captures to The Vault and receive proactive alerts. No passwords — Google
        handles identity.
      </p>
      <button
        type="button"
        onClick={() => void signIn("google", { callbackUrl: "/" })}
        className="focus-ring mt-8 inline-flex min-h-[48px] items-center rounded-full bg-[var(--ink)] px-6 text-sm font-medium text-white transition hover:bg-black"
      >
        Continue with Google
      </button>
      <button
        type="button"
        onClick={() => void enterDemo()}
        disabled={demoBusy}
        className="focus-ring mt-3 inline-flex min-h-[48px] items-center rounded-full border border-[var(--line-strong)] bg-white px-6 text-sm font-medium text-[var(--ink)] transition hover:bg-black/[0.03] disabled:opacity-60"
      >
        {demoBusy ? "Entering…" : "Continue as demo"}
      </button>
      <p className="mt-4 text-xs leading-relaxed text-[var(--muted)]">
        Demo uses a local guest session — fine for trying Capture, Vault, Plans, and Concierge.
      </p>
    </div>
  );
}
