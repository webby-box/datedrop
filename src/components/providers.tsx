"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { isStaticApp, appBasePath } from "@/lib/static-mode";
import { installStaticFetch } from "@/lib/static-fetch";

if (typeof window !== "undefined" && isStaticApp) {
  installStaticFetch();
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath={`${appBasePath}/api/auth`}>
      {children}
      <Toaster
        theme="light"
        richColors
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: 16,
            border: "1px solid rgba(17,17,17,0.1)",
            background: "#fff",
            fontFamily: "var(--font-geist), system-ui, sans-serif",
          },
        }}
      />
    </SessionProvider>
  );
}
