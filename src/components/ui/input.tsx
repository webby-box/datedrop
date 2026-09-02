import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-full border border-[var(--line-strong)] bg-white px-4 text-sm text-[var(--ink)] placeholder:text-[var(--muted-soft)] transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:border-[rgba(17,17,17,0.28)] focus-visible:ring-[3px] focus-visible:ring-black/[0.08] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
