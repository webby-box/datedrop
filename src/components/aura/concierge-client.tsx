"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "./app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Msg = { role: "user" | "aura"; text: string };

const PROMPTS = [
  "When should I book Lilia for next month?",
  "What is the climate like for my next plan?",
  "How should I book a hard table from The Vault?",
];

export function ConciergeClient() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "aura",
      text: "I'm Aura. Ask about booking windows, climate for your plan dates, or logistics for anything in The Vault. I never invent live table times.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(preset?: string) {
    const message = (preset ?? input).trim();
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

        <div className="mt-4 flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              disabled={busy}
              onClick={() => void send(p)}
              className="chip text-left hover:bg-black/10 disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        <div className="mt-6 flex-1 space-y-3.5 overflow-y-auto rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--bg-elevated)]/80 p-4 shadow-[var(--shadow-card)] md:p-6">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[90%] rounded-[var(--radius-lg)] px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "ml-auto bg-[var(--ink)] text-[#f7f2e9] shadow-sm"
                  : "card-light mr-auto text-[var(--ink-soft)]"
              }`}
            >
              {m.role === "aura" ? <p className="kicker mb-2">Aura</p> : null}
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          ))}
          {busy ? <p className="page-lead">Aura is thinking…</p> : null}
          <div ref={bottom} />
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
