"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        theme="light"
        richColors
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: 14,
            border: "1px solid rgba(17,17,17,0.08)",
            fontFamily: "var(--font-geist), system-ui, sans-serif",
          },
        }}
      />
    </SessionProvider>
  );
}
