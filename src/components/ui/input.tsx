import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-full border border-[var(--line-strong)] bg-[var(--bg-elevated)] px-4 text-sm text-[var(--ink)] placeholder:text-[var(--muted-soft)] transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:border-[var(--gold)] focus-visible:ring-[3px] focus-visible:ring-[rgba(184,149,106,0.28)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
