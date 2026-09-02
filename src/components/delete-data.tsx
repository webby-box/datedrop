"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DeleteData() {
  const [msg, setMsg] = useState<string | null>(null);
  async function run() {
    if (!confirm("Delete all of your Aura captures, boards, and plans?")) return;
    const res = await fetch("/api/settings/delete", { method: "POST" });
    const json = await res.json();
    setMsg(json.ok ? "Deleted. Your inbox is empty." : json.error);
  }
  return (
    <div className="mt-12 border-t border-[var(--line)] pt-8">
      <h2 className="serif text-2xl">Delete my data</h2>
      <p className="page-lead mt-2">
        Removes captures, boards, board places, plans, and your Aura user row. Your Google
        account is separate — revoke Aura access in your Google account settings if you want
        the OAuth grant gone too.
      </p>
      <Button variant="outline" className="mt-5" onClick={() => void run()}>
        Delete my data
      </Button>
      {msg && <p className="mt-3 text-sm text-[var(--ink)]">{msg}</p>}
    </div>
  );
}
