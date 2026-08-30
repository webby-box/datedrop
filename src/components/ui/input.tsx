import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-[rgba(244,234,213,0.14)] bg-[#161410] px-4 text-sm text-[#f4ead5] placeholder:text-[#9a8f7e] outline-none focus:border-[#d4a574]/60",
        className,
      )}
      {...props}
    />
  );
}
