import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { mongoConfigured } from "@/lib/mongodb";
import { captures } from "@/lib/models";
import { storeScreenshot } from "@/lib/blob";
import { prepareImage, ImageError } from "@/lib/image";
import { assertCaptureRate } from "@/lib/rate-limit";
import { classifyUrl } from "@/lib/urls";
import { processCapture } from "@/lib/process";
import { ensureIndexesOnce } from "@/lib/mongodb";

export const runtime = "nodejs";

function fail(err: unknown, fallback = 500) {
  const e = err as Error & { status?: number };
  const status = e.status || fallback;
  return NextResponse.json({ error: e.message || "Unexpected error" }, { status });
}

type IncomingImage = { name?: string; mime?: string; dataBase64?: string };

async function parseBody(req: Request): Promise<{
  pastedUrl: string;
  files: { name: string; mime: string; bytes: Buffer }[];
}> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await req.json()) as {
      url?: string;
      images?: IncomingImage[];
    };
    const pastedUrl = String(body.url || "").trim();
    const images = Array.isArray(body.images) ? body.images : [];
    const files: { name: string; mime: string; bytes: Buffer }[] = [];
    for (const img of images) {
      if (!img?.dataBase64) continue;
      const raw = String(img.dataBase64).replace(/^data:[^;]+;base64,/, "");
      const bytes = Buffer.from(raw, "base64");
      if (!bytes.length) continue;
      files.push({
        name: img.name || "shot.jpg",
        mime: img.mime || "image/jpeg",
        bytes,
      });
    }
    return { pastedUrl, files };
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch (err) {
    const msg = (err as Error)?.message || String(err);
    const error = new Error(
      `Failed to parse body as FormData. Prefer JSON {url?, images:[{name,mime,dataBase64}]} — ${msg}`,
    );
    (error as Error & { status: number }).status = 400;
    throw error;
  }

  const pastedUrl = String(form.get("url") || "").trim();
  const rawFiles = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const files = await Promise.all(
    rawFiles.map(async (file) => ({
      name: file.name || "shot.jpg",
      mime: file.type || "image/jpeg",
      bytes: Buffer.from(await file.arrayBuffer()),
    })),
  );
  return { pastedUrl, files };
}

export async function GET() {
  try {
    const user = await requireUser();
    if (!mongoConfigured()) {
      return NextResponse.json({
        captures: [],
        warning: "MONGODB_URI is not set. Captures will not persist.",
      });
    }
    const col = await captures();
    const rows = await col
      .find({ userId: user.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    return NextResponse.json({
      captures: rows.map((r) => ({ ...r, _id: r._id?.toString() })),
    });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!mongoConfigured()) {
      return NextResponse.json(
        { error: "MONGODB_URI is not set. Add it to .env.local to save captures." },
        { status: 503 },
      );
    }
    await ensureIndexesOnce();
    await assertCaptureRate(user.userId);

    const { pastedUrl, files } = await parseBody(req);

    if (!files.length && !pastedUrl) {
      return NextResponse.json({ error: "Drop a screenshot or paste a Maps / booking URL." }, { status: 400 });
    }

    const warnings: string[] = [];

    const preparedRows = await Promise.all(
      files.map(async (file) => {
        const ready = await prepareImage(file.bytes, file.mime || "image/jpeg", file.name || "shot.jpg");
        const stored = await storeScreenshot(ready.bytes, ready.mime, file.name || "shot.jpg");
        return { ready, stored };
      }),
    );

    const blobUrls = preparedRows.map((r) => r.stored.url);
    const prepared = preparedRows.map((r) => r.ready);
    for (const r of preparedRows) {
      if (r.stored.warning) warnings.push(r.stored.warning);
    }

    let source: "upload" | "maps_url" | "booking_url" = "upload";
    let effectiveUrl = pastedUrl;
    if (pastedUrl) {
      const parsed = classifyUrl(pastedUrl);
      if (!parsed) {
        if (!files.length) {
          return NextResponse.json(
            {
              error:
                "That URL is not a supported Maps or public venue link. Paste google.com/maps, maps.google.com, maps.app.goo.gl, Instagram, TikTok, Resy, OpenTable, or Tock public pages — we do not fetch live slot grids or scrape social posts.",
            },
            { status: 400 },
          );
        }
        warnings.push("Ignored unsupported URL — processing screenshot(s) only.");
        effectiveUrl = "";
      } else {
        source = parsed.source;
      }
    }

    const col = await captures();
    const now = new Date();
    const result = await col.insertOne({
      userId: user.userId,
      status: "processing",
      blobUrls,
      source,
      pastedUrl: effectiveUrl || undefined,
      createdAt: now,
      updatedAt: now,
    });

    const id = result.insertedId.toString();
    // fire and forget — UI polls; vision already concurrent inside extract
    void processCapture(id, prepared);

    return NextResponse.json({ id, warnings, status: "processing" });
  } catch (err) {
    if (err instanceof ImageError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return fail(err);
  }
}
