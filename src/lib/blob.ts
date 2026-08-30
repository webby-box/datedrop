import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export type StoredBlob = {
  url: string;
  storage: "vercel-blob" | "local";
  warning?: string;
};

const LOCAL_DIR = path.join(process.cwd(), "public", "uploads");

export async function storeScreenshot(
  bytes: Buffer,
  contentType: string,
  filename: string,
): Promise<StoredBlob> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const safeName = `${Date.now()}-${randomUUID()}-${filename.replace(/[^\w.-]+/g, "_")}`;

  if (token) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`captures/${safeName}`, bytes, {
      access: "private",
      contentType,
      token,
    } as never);
    return { url: blob.url, storage: "vercel-blob" };
  }

  await mkdir(LOCAL_DIR, { recursive: true });
  const dest = path.join(LOCAL_DIR, safeName);
  await writeFile(dest, bytes);
  return {
    url: `/uploads/${safeName}`,
    storage: "local",
    warning:
      "BLOB_READ_WRITE_TOKEN is not set. Screenshots are stored locally in public/uploads for demo only — they are not private.",
  };
}
