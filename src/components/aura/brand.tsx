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
      <span className="serif-italic text-3xl tracking-tight text-[#111] md:text-[2rem]">Aura</span>
      {!compact && (
        <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.32em] text-[#6b6b6b]">
          Concierge Elite
        </span>
      )}
    </Link>
  );
}
