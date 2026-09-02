"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "./app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Msg = { role: "user" | "aura"; text: string };

export function ConciergeClient() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "aura",
      text: "I'm Aura. Ask about booking windows, climate for your plan dates, or logistics for anything in The Vault. I never invent live table times.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    const message = input.trim();
    if (!message || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: message }]);
    setBusy(true);
    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Concierge unavailable");
        setMessages((m) => [...m, { role: "aura", text: json.error || "Something went wrong." }]);
      } else {
        setMessages((m) => [...m, { role: "aura", text: json.reply }]);
      }
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto flex max-w-3xl flex-col py-6 md:py-10" style={{ minHeight: "70vh" }}>
        <div>
          <p className="kicker">Concierge</p>
          <h1 className="page-title serif mt-2 text-4xl md:text-5xl">Ask Aura</h1>
          <p className="page-lead mt-2.5">Vault-aware advice. Outbound booking only.</p>
        </div>

        <div className="mt-6 flex-1 space-y-3.5 overflow-y-auto rounded-[var(--radius-xl)] border border-[var(--line)] bg-white/70 p-4 shadow-[var(--shadow-card)] md:p-6">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[90%] rounded-[var(--radius-lg)] px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "ml-auto bg-[var(--ink)] text-white shadow-sm"
                  : "card-light mr-auto text-[var(--ink-soft)]"
              }`}
            >
              {m.role === "aura" ? <p className="kicker mb-2">Aura</p> : null}
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          ))}
        </div>

        <form
          className="mt-4 flex gap-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="When should I book Lilia for next month?"
            className="h-12 flex-1"
            disabled={busy}
          />
          <Button type="submit" disabled={busy} className="h-12 px-6">
            {busy ? "…" : "Send"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
