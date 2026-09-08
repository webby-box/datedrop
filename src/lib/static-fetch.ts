"use client";

import { handleStaticApi } from "@/lib/static-api";

function apiPathFromUrl(raw: string) {
  const parsed = new URL(raw, typeof window === "undefined" ? "http://localhost" : window.location.origin);
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  let path = parsed.pathname;
  if (base && path.startsWith(base)) path = path.slice(base.length) || "/";
  if (path.length > 1) path = path.replace(/\/$/, "");
  return path || "/";
}

export function installStaticFetch() {
  if (typeof window === "undefined") return;
  const w = window as Window & { __auraStaticFetch?: boolean };
  if (w.__auraStaticFetch) return;
  w.__auraStaticFetch = true;
  const orig = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const path = apiPathFromUrl(url);
    if (path.startsWith("/api/")) {
      const req = input instanceof Request ? input : new Request(new URL(url, window.location.origin).toString(), init);
      const mocked = await handleStaticApi(path, req);
      if (mocked) return mocked;
    }
    return orig(input, init);
  };
}
