import Link from "next/link";
import { cn } from "@/lib/utils";

export function AuraBrand({
  href = "/",
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("group flex flex-col leading-none", className)}>
      <span className="serif-italic text-[1.75rem] tracking-tight text-[var(--ink)] transition group-hover:opacity-80 md:text-[2rem]">
        Aura
      </span>
      {!compact && (
        <span className="mt-1.5 text-[9px] font-medium uppercase tracking-[0.32em] text-[var(--muted)]">
          Concierge Elite
        </span>
      )}
    </Link>
  );
}
