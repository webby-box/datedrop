"use client";

import { useSearchParams } from "next/navigation";
import { isStaticApp } from "@/lib/static-mode";

export function useRouteId(paramId: string) {
  const sp = useSearchParams();
  if (isStaticApp && (paramId === "_" || !paramId)) {
    return sp.get("id") || paramId;
  }
  return paramId;
}
