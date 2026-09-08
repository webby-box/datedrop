"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "./app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Link2, ClipboardPaste, Camera } from "lucide-react";
import { captureHref } from "@/lib/static-mode";

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

type PackedImage = { name: string; mime: string; dataBase64: string };
type RecentCapture = { _id: string; status: string; pastedUrl?: string; createdAt?: string };

async function compressImage(file: File): Promise<PackedImage> {
  try {
    const bitmap = await createImageBitmap(file);
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
    return { name: file.name.replace(/\.[^.]+$/, "") + ".jpg", mime: "image/jpeg", dataBase64: btoa(binary) };
  } catch {
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
  const [previews, setPreviews] = useState<string[]>([]);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [recent, setRecent] = useState<RecentCapture[]>([]);

  const onFiles = useCallback((list: FileList | File[] | null) => {
    if (!list) return;
    const arr = Array.from(list as ArrayLike<File>).filter(
      (f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name),
    ).slice(0, 4);
    if (!arr.length) return;
    setFiles(arr);
    setPreviews((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p));
      return arr.map((f) => URL.createObjectURL(f));
    });
  }, []);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/captures");
      const json = await res.json().catch(() => ({}));
      if (res.ok) setRecent((json.captures || []).slice(0, 5));
    })();
  }, []);

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const clip = e.clipboardData;
      if (!clip) return;
      const imgs = Array.from(clip.files || []).filter((f) => f.type.startsWith("image/"));
      if (imgs.length) {
        e.preventDefault();
        onFiles(imgs);
        toast.success("Pasted screenshot");
        return;
      }
      const text = clip.getData("text").trim();
      if (/^https?:\/\//i.test(text)) {
        setUrl(text);
        toast.info("Pasted URL");
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [onFiles]);

  async function pasteFromClipboard() {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith("image/"));
        if (type) {
          const blob = await item.getType(type);
          const file = new File([blob], "clipboard.jpg", { type: blob.type || "image/jpeg" });
          onFiles([file]);
          toast.success("Pasted screenshot");
          return;
        }
      }
      const text = (await navigator.clipboard.readText()).trim();
      if (/^https?:\/\//i.test(text)) {
        setUrl(text);
        toast.info("Pasted URL");
      } else {
        toast.error("Clipboard has no image or URL");
      }
    } catch {
      toast.error("Allow clipboard access, or press ⌘V / Ctrl+V");
    }
  }

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

      const payload = { url: url.trim() || undefined, images };
      let res: Response;
      try {
        res = await fetch("/api/captures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        toast.loading("Retrying upload…", { id: toastId });
        const form = new FormData();
        files.forEach((f) => form.append("files", f));
        if (url.trim()) form.append("url", url.trim());
        res = await fetch("/api/captures", { method: "POST", body: form });
      }

      if (!res.ok && res.status >= 400) {
        const peek = await res.clone().json().catch(() => null);
        const errMsg = String(peek?.error || "");
        if (/formdata|parse body|multipart/i.test(errMsg) || res.status === 415) {
          toast.loading("Retrying upload…", { id: toastId });
          const form = new FormData();
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
      router.push(captureHref(json.id));
    } catch {
      toast.error("Network error", { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl py-8 md:py-12">
        <p className="kicker text-center">Capture</p>
        <h1 className="page-title serif mt-2 text-center text-4xl md:text-5xl">Drop into The Vault</h1>
        <p className="page-lead mx-auto mt-3 max-w-md text-center">
          Screenshots, camera, clipboard, or a public Maps / venue URL. Vision extracts what is visible;
          you confirm before save.
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
            drag ? "border-[var(--gold)] bg-[#b8956a]/15" : "border-[var(--line-strong)]"
          }`}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ink)] text-[var(--gold)] shadow-sm">
            <Upload className="h-6 w-6" />
          </div>
          <p className="serif-italic mt-5 text-2xl md:text-[1.75rem]">Drop screenshots here</p>
          <p className="mt-2 text-sm text-[var(--muted)]">PNG / JPG / HEIC · up to 4 · or press Ctrl+V</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <label className="inline-flex cursor-pointer">
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
              <span className="focus-ring inline-flex min-h-[44px] items-center rounded-full bg-[var(--ink)] px-5 text-sm text-white hover:bg-black">
                Choose files
              </span>
            </label>
            <label className="inline-flex cursor-pointer">
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFiles(e.target.files)} />
              <span className="focus-ring inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--bg-elevated)] px-5 text-sm">
                <Camera className="h-4 w-4" />
                Use camera
              </span>
            </label>
            <button
              type="button"
              onClick={() => void pasteFromClipboard()}
              className="focus-ring inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--bg-elevated)] px-5 text-sm"
            >
              <ClipboardPaste className="h-4 w-4" />
              Paste
            </button>
          </div>
          {previews.length ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {previews.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt={files[i]?.name || "preview"} className="h-24 w-full rounded-[var(--radius-md)] object-cover" />
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-7 flex items-center gap-3">
          <div className="divider flex-1" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">or paste URL</span>
          <div className="divider flex-1" />
        </div>

        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="maps.app.goo.gl or maps.google.com…"
              className="control-lg h-12 pl-11"
            />
          </div>
          <Button className="mt-8 w-full" size="lg" disabled={busy} type="submit">
            {busy ? "Uploading…" : "Process capture"}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs leading-relaxed text-[var(--muted)]">
          Aura does not scrape Resy or OpenTable. Outbound booking links only.
        </p>

        {recent.length ? (
          <div className="mt-12">
            <p className="kicker">Recent</p>
            <h2 className="serif-italic mt-2 text-2xl">In progress</h2>
            <ul className="mt-4 space-y-2">
              {recent.map((c) => (
                <li key={c._id}>
                  <a
                    href={captureHref(c._id)}
                    className="card-light card-interactive flex items-center justify-between rounded-[var(--radius-lg)] px-4 py-3 text-sm"
                  >
                    <span className="truncate text-[var(--muted)]">{c.pastedUrl || "Screenshot"}</span>
                    <span className="chip">{c.status.replace("_", " ")}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
