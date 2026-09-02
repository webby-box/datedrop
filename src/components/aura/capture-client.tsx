"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "./app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Link2 } from "lucide-react";

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

type PackedImage = { name: string; mime: string; dataBase64: string };

async function fileToImageBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

async function compressImage(file: File): Promise<PackedImage> {
  try {
    const bitmap = await fileToImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) throw new Error("toBlob");

    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return { name, mime: "image/jpeg", dataBase64: btoa(binary) };
  } catch {
    // Fallback: send original as base64 (may be HEIC — server will try sharp)
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return {
      name: file.name || "shot.jpg",
      mime: file.type || "application/octet-stream",
      dataBase64: btoa(binary),
    };
  }
}

export function CaptureClient() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const onFiles = useCallback((list: FileList | null) => {
    if (!list?.length) return;
    const next = Array.from(list).filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name)).slice(0, 4);
    setFiles(next);
  }, []);

  async function submit() {
    if (!files.length && !url.trim()) {
      toast.error("Drop a screenshot or paste a Maps URL");
      return;
    }
    setBusy(true);
    const toastId = toast.loading(files.length ? "Compressing images…" : "Uploading…");
    try {
      let images: PackedImage[] = [];
      if (files.length) {
        images = await Promise.all(files.map((f) => compressImage(f)));
        toast.loading("Uploading…", { id: toastId });
      }

      const payload = {
        url: url.trim() || undefined,
        images,
      };

      let res: Response;
      try {
        res = await fetch("/api/captures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        // Network-level failure — try multipart fallback
        toast.loading("Retrying upload…", { id: toastId });
        const form = new FormData();
        files.forEach((f) => form.append("files", f));
        if (url.trim()) form.append("url", url.trim());
        res = await fetch("/api/captures", { method: "POST", body: form });
      }

      // If JSON path got a parse/body error, fall back to FormData once
      if (!res.ok && res.status >= 400) {
        const peek = await res.clone().json().catch(() => null);
        const errMsg = String(peek?.error || "");
        if (/formdata|parse body|multipart/i.test(errMsg) || res.status === 415) {
          toast.loading("Retrying upload…", { id: toastId });
          const form = new FormData();
          // Prefer compressed blobs when available
          if (images.length) {
            for (const img of images) {
              const bin = atob(img.dataBase64);
              const arr = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
              form.append("files", new File([arr], img.name, { type: img.mime }));
            }
          } else {
            files.forEach((f) => form.append("files", f));
          }
          if (url.trim()) form.append("url", url.trim());
          res = await fetch("/api/captures", { method: "POST", body: form });
        }
      }

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Capture failed", { id: toastId });
        return;
      }
      toast.success("Reading the chrome…", { id: toastId });
      router.push(`/captures/${json.id}`);
    } catch {
      toast.error("Network error", { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl py-8 md:py-14">
        <p className="kicker text-center">Capture</p>
        <h1 className="page-title serif mt-2 text-center text-4xl md:text-5xl">Drop into The Vault</h1>
        <p className="page-lead mx-auto mt-3 max-w-md text-center">
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
          className={`card-light mt-10 rounded-[var(--radius-2xl)] border-2 border-dashed p-8 text-center transition md:p-12 ${
            drag ? "border-[var(--ink)] bg-black/[0.03]" : "border-[var(--line-strong)]"
          }`}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ink)] text-white shadow-sm">
            <Upload className="h-6 w-6" />
          </div>
          <p className="serif-italic mt-5 text-2xl md:text-[1.75rem]">Drop screenshots</p>
          <p className="mt-2 text-sm text-[var(--muted)]">PNG / JPG · up to 4</p>
          <label className="mt-6 inline-flex cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
            <span className="focus-ring inline-flex min-h-[44px] items-center rounded-full bg-[var(--ink)] px-5 text-sm text-white transition hover:bg-black">
              Choose files
            </span>
          </label>
          {files.length ? (
            <ul className="mt-5 space-y-1.5 text-xs text-[var(--muted)]">
              {files.map((f) => (
                <li key={f.name}>{f.name}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="mt-7 flex items-center gap-3">
          <div className="divider flex-1" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">or paste URL</span>
          <div className="divider flex-1" />
        </div>

        <div className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://maps.google.com/…"
              className="control-lg h-12 pl-11"
            />
          </div>
        </div>

        <Button className="mt-8 w-full" size="lg" disabled={busy} onClick={() => void submit()}>
          {busy ? "Uploading…" : "Process capture"}
        </Button>
        <p className="mt-4 text-center text-xs leading-relaxed text-[var(--muted)]">
          Aura does not scrape Resy or OpenTable. Outbound booking links only.
        </p>
      </div>
    </AppShell>
  );
}
