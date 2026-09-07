"use client";

import { OCCASIONS } from "@/lib/occasions";
import { cn } from "@/lib/utils";

export function OccasionChips({
  value,
  onChange,
  allowAll = false,
}: {
  value: string;
  onChange: (id: string) => void;
  allowAll?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="listbox" aria-label="Occasion">
      {allowAll ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className={cn(
            "focus-ring rounded-full px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.14em] transition",
            !value ? "bg-black text-white" : "bg-black/[0.04] text-[var(--muted)] hover:bg-black/[0.08]",
          )}
        >
          All
        </button>
      ) : null}
      {OCCASIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "focus-ring rounded-full px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.14em] transition",
            value === o.id
              ? "bg-black text-white"
              : "bg-black/[0.04] text-[var(--muted)] hover:bg-black/[0.08]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
