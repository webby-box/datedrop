import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-full border border-[rgba(17,17,17,0.12)] bg-white px-4 text-sm text-[#111] placeholder:text-[#6b6b6b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
        className,
      )}
      {...props}
    />
  );
}
