"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "./app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Link2 } from "lucide-react";

export function CaptureClient() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const onFiles = useCallback((list: FileList | null) => {
    if (!list?.length) return;
    const next = Array.from(list).filter((f) => f.type.startsWith("image/")).slice(0, 4);
    setFiles(next);
  }, []);

  async function submit() {
    if (!files.length && !url.trim()) {
      toast.error("Drop a screenshot or paste a Maps URL");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      if (url.trim()) form.append("url", url.trim());
      const res = await fetch("/api/captures", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Capture failed");
        return;
      }
      toast.success("Reading the chrome…");
      router.push(`/captures/${json.id}`);
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl py-8 md:py-14">
        <p className="kicker text-center">Capture</p>
        <h1 className="serif mt-2 text-center text-4xl md:text-5xl">Drop into The Vault</h1>
        <p className="mx-auto mt-3 max-w-md text-center text-sm text-[#6b6b6b]">
          Screenshots of Maps pins, IG stories, booking apps — or paste a public Maps / venue URL.
          Vision extracts what&apos;s visible; you confirm before save.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            onFiles(e.dataTransfer.files);
          }}
          className={`card-light mt-10 rounded-[32px] border-2 border-dashed p-8 text-center transition md:p-12 ${
            drag ? "border-black bg-black/[0.03]" : "border-[rgba(17,17,17,0.12)]"
          }`}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
            <Upload className="h-6 w-6" />
          </div>
          <p className="serif-italic mt-4 text-2xl">Drop screenshots</p>
          <p className="mt-2 text-sm text-[#6b6b6b]">PNG / JPG · up to 4</p>
          <label className="mt-6 inline-flex cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
            <span className="rounded-full bg-black px-5 py-2.5 text-sm text-white">Choose files</span>
          </label>
          {files.length ? (
            <ul className="mt-4 space-y-1 text-xs text-[#6b6b6b]">
              {files.map((f) => (
                <li key={f.name}>{f.name}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[rgba(17,17,17,0.08)]" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#6b6b6b]">or paste URL</span>
          <div className="h-px flex-1 bg-[rgba(17,17,17,0.08)]" />
        </div>

        <div className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://maps.google.com/…"
              className="h-12 rounded-full border-[rgba(17,17,17,0.1)] bg-white pl-11"
            />
          </div>
        </div>

        <Button className="mt-8 w-full" size="lg" disabled={busy} onClick={() => void submit()}>
          {busy ? "Uploading…" : "Process capture"}
        </Button>
        <p className="mt-4 text-center text-xs text-[#6b6b6b]">
          Aura does not scrape Resy or OpenTable. Outbound booking links only.
        </p>
      </div>
    </AppShell>
  );
}
