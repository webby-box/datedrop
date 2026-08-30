import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[rgba(244,234,213,0.14)] px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-[#d4a574]",
        className,
      )}
    >
      {children}
    </span>
  );
}
