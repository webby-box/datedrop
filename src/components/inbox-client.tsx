"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { captureHref } from "@/lib/static-mode";

type Capture = {
  _id: string;
  status: string;
  blobUrls: string[];
  source: string;
  pastedUrl?: string;
  extraction?: { summary: string; candidates: { name: string }[] };
  error?: string;
};

export function InboxClient() {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/captures");
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Could not load inbox");
      return;
    }
    setCaptures(json.captures || []);
    if (json.warning) setWarning(json.warning);
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 2500);
    return () => clearInterval(t);
  }, [load]);

  async function submit(files: FileList | File[]) {
    setBusy(true);
    setError(null);
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    if (url.trim()) fd.append("url", url.trim());
    const res = await fetch("/api/captures", { method: "POST", body: fd });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Upload failed");
      return;
    }
    if (json.warnings?.length) setWarning(json.warnings.join(" "));
    setUrl("");
    await load();
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <p className="kicker">Inbox</p>
      <h1 className="serif mt-2 text-4xl md:text-5xl">Drop the night in.</h1>
      <p className="mt-3 max-w-xl text-[#cfc3ae]">
        Google Maps pins, Apple Maps, IG stories, Resy screens, postcards — or paste a Maps / venue
        URL. We parse the public page. We never fetch a live booking grid.
      </p>

      <label
        className="ticket mt-8 block cursor-pointer rounded-2xl border-dashed p-8 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length) void submit(e.dataTransfer.files);
        }}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && void submit(e.target.files)}
        />
        <p className="serif text-2xl">Drop screenshots here</p>
        <p className="mt-2 text-sm text-[#9a8f7e]">JPG, PNG, WebP. HEIC converts when possible.</p>
      </label>

      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void submit([]);
        }}
      >
        <Input
          placeholder="Paste maps.app.goo.gl, google.com/maps, resy.com, opentable.com/r/…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Button type="submit" disabled={busy}>
          {busy ? "Reading…" : "Add URL"}
        </Button>
      </form>

      {error && <p className="mt-4 text-sm text-[#b5523a]">{error}</p>}
      {warning && <p className="mt-2 text-sm text-[#c9a227]">{warning}</p>}

      <ul className="mt-10 space-y-3">
        {captures.map((c) => (
          <li key={c._id} className="ticket flex items-center justify-between rounded-2xl p-4">
            <div>
              <p className="kicker">{c.status.replace("_", " ")}</p>
              <p className="serif text-xl">
                {c.extraction?.candidates[0]?.name || c.pastedUrl || "Screenshot"}
              </p>
              <p className="text-sm text-[#9a8f7e]">{c.extraction?.summary || c.source}</p>
              {c.error && <p className="text-sm text-[#b5523a]">{c.error}</p>}
            </div>
            <Link href={captureHref(c._id)} className="text-sm text-[#d4a574]">
              Open →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
