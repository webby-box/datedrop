"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DeleteData() {
  const [msg, setMsg] = useState<string | null>(null);
  async function run() {
    if (!confirm("Delete all of your DateDrop captures, boards, and plans?")) return;
    const res = await fetch("/api/settings/delete", { method: "POST" });
    const json = await res.json();
    setMsg(json.ok ? "Deleted. Your inbox is empty." : json.error);
  }
  return (
    <div className="mt-12 border-t border-[rgba(244,234,213,0.08)] pt-8">
      <h2 className="serif text-2xl">Delete my data</h2>
      <p className="mt-2 text-sm text-[#9a8f7e]">
        Removes captures, boards, board places, plans, and your DateDrop user row. Clerk&apos;s
        account (if configured) is separate — delete that in Clerk if you want the identity gone too.
      </p>
      <Button variant="outline" className="mt-4" onClick={() => void run()}>
        Delete my data
      </Button>
      {msg && <p className="mt-3 text-sm text-[#d4a574]">{msg}</p>}
    </div>
  );
}
