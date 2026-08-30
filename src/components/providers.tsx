"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

export function Providers({
  children,
  publishableKey,
}: {
  children: React.ReactNode;
  publishableKey?: string;
}) {
  const inner = (
    <>
      {children}
      <Toaster theme="dark" richColors />
    </>
  );
  if (!publishableKey) return inner;
  return (
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
      {inner}
    </ClerkProvider>
  );
}
