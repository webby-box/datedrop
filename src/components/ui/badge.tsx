import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
  tone = "light",
}: {
  className?: string;
  children: React.ReactNode;
  tone?: "light" | "dark" | "live";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em]",
        tone === "light" && "bg-black/5 text-[#2a2a2a]",
        tone === "dark" && "bg-white/10 text-white",
        tone === "live" && "bg-white text-black",
        className,
      )}
    >
      {children}
    </span>
  );
}
