import sharp from "sharp";

const MAX_EDGE = 1600;
const HEIC = new Set(["image/heic", "image/heif", "image/heic-sequence"]);

export class ImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageError";
  }
}

export async function prepareImage(bytes: Buffer, mime: string, filename: string) {
  const lower = filename.toLowerCase();
  const isHeic =
    HEIC.has(mime.toLowerCase()) || lower.endsWith(".heic") || lower.endsWith(".heif");

  if (isHeic) {
    try {
      const out = await sharp(bytes, { failOn: "none" })
        .rotate()
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      return { bytes: out, mime: "image/jpeg" as const };
    } catch {
      throw new ImageError(
        "This looks like an HEIC/HEIF photo. DateDrop could not convert it on this host — export a JPG or PNG from Photos and drop that instead.",
      );
    }
  }

  const img = sharp(bytes, { failOn: "none" }).rotate();
  const meta = await img.metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  const needsResize = Math.max(w, h) > MAX_EDGE;
  const pipeline = needsResize
    ? img.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    : img;
  const out = await pipeline.jpeg({ quality: 86 }).toBuffer();
  return { bytes: out, mime: "image/jpeg" as const };
}
