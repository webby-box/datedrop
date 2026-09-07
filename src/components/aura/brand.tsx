import Link from "next/link";
import { cn } from "@/lib/utils";

export function AuraBrand({
  href = "/",
  compact = false,
  inverted = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  inverted?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("group flex items-center gap-3 leading-none", className)}>
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-medium tracking-[0.12em]",
          inverted ? "bg-[var(--gold)] text-[var(--ink)]" : "bg-[var(--ink)] text-[var(--gold)]",
        )}
      >
        A
      </span>
      <span className="flex flex-col">
        <span
          className={cn(
            "serif-italic text-[1.65rem] tracking-tight transition group-hover:opacity-80 md:text-[1.85rem]",
            inverted ? "text-[#f7f2e9]" : "text-[var(--ink)]",
          )}
        >
          Aura
        </span>
        {!compact && (
          <span
            className={cn(
              "mt-1 text-[9px] font-medium uppercase tracking-[0.32em]",
              inverted ? "text-[var(--gold)]" : "text-[var(--muted)]",
            )}
          >
            Concierge Elite
          </span>
        )}
      </span>
    </Link>
  );
}
