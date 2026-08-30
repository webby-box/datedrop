import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { mongoConfigured } from "@/lib/mongodb";
import { captures } from "@/lib/models";
import { storeScreenshot } from "@/lib/blob";
import { prepareImage, ImageError } from "@/lib/image";
import { assertCaptureRate } from "@/lib/rate-limit";
import { classifyUrl } from "@/lib/urls";
import { processCapture } from "@/lib/process";
import { ensureIndexes } from "@/lib/mongodb";

function fail(err: unknown, fallback = 500) {
  const e = err as Error & { status?: number };
  const status = e.status || fallback;
  return NextResponse.json({ error: e.message || "Unexpected error" }, { status });
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
      .find({ userId: user.clerkId })
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
    await ensureIndexes();
    await assertCaptureRate(user.clerkId);

    const form = await req.formData();
    const pastedUrl = String(form.get("url") || "").trim();
    const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

    if (!files.length && !pastedUrl) {
      return NextResponse.json({ error: "Drop a screenshot or paste a Maps / booking URL." }, { status: 400 });
    }

    const blobUrls: string[] = [];
    const prepared: { mime: string; bytes: Buffer }[] = [];
    const warnings: string[] = [];

    for (const file of files) {
      const buf = Buffer.from(await file.arrayBuffer());
      const ready = await prepareImage(buf, file.type || "image/jpeg", file.name || "shot.jpg");
      const stored = await storeScreenshot(ready.bytes, ready.mime, file.name || "shot.jpg");
      blobUrls.push(stored.url);
      prepared.push(ready);
      if (stored.warning) warnings.push(stored.warning);
    }

    let source: "upload" | "maps_url" | "booking_url" = "upload";
    if (pastedUrl) {
      const parsed = classifyUrl(pastedUrl);
      if (!parsed) {
        return NextResponse.json(
          {
            error:
              "That URL is not a supported Maps or public venue link. Paste google.com/maps, maps.app.goo.gl, Resy, OpenTable, or Tock public pages — we do not fetch live slot grids.",
          },
          { status: 400 },
        );
      }
      source = parsed.source;
    }

    const col = await captures();
    const now = new Date();
    const result = await col.insertOne({
      userId: user.clerkId,
      status: "processing",
      blobUrls,
      source,
      pastedUrl: pastedUrl || undefined,
      createdAt: now,
      updatedAt: now,
    });

    const id = result.insertedId.toString();
    // fire and forget — UI polls
    void processCapture(id, prepared);

    return NextResponse.json({ id, warnings, status: "processing" });
  } catch (err) {
    if (err instanceof ImageError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return fail(err);
  }
}
