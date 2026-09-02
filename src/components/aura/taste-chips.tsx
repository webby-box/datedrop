"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Manhattan Classics",
  "Date-night rooms",
  "Walkable clusters",
  "Wine-forward",
  "Omakase",
  "Neighborhood bars",
  "Garden terraces",
  "Late kitchen",
];

export function TasteChips({ editable = true }: { editable?: boolean }) {
  const [profiles, setProfiles] = useState<string[]>(SUGGESTIONS.slice(0, 4));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/taste");
        const json = await res.json();
        if (res.ok && Array.isArray(json.profiles)) setProfiles(json.profiles);
      } catch {
        /* keep defaults */
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  async function toggle(tag: string) {
    if (!editable) return;
    const next = profiles.includes(tag)
      ? profiles.filter((p) => p !== tag)
      : [...profiles, tag].slice(0, 12);
    setProfiles(next);
    const res = await fetch("/api/taste", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profiles: next }),
    });
    if (!res.ok) toast.error("Could not save taste profile");
    else toast.success("Taste updated");
  }

  const pool = Array.from(new Set([...profiles, ...SUGGESTIONS]));

  return (
    <div className="flex flex-wrap gap-2">
      {!loaded
        ? Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="skeleton h-9 w-28 rounded-full" />
          ))
        : pool.map((tag) => {
            const on = profiles.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                disabled={!editable}
                onClick={() => void toggle(tag)}
                className={cn(
                  "rounded-full px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.14em] transition",
                  on ? "bg-black text-white" : "bg-black/5 text-[#6b6b6b] hover:bg-black/10",
                  !editable && "cursor-default",
                )}
              >
                {tag}
              </button>
            );
          })}
    </div>
  );
}
