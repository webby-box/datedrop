import { extractFromImages, mockExtraction } from "./llm";
import { textSearch, PlacesNotConfigured } from "./places";
import { classifyUrl } from "./urls";
import type { CaptureRecord } from "./models";
import { captures } from "./models";
import { ObjectId } from "mongodb";
import type { Candidate, Extraction } from "./types";

async function resolveMatches(extraction: Extraction): Promise<Extraction> {
  const candidates: Candidate[] = await Promise.all(
    extraction.candidates.map(async (c) => {
      if (c.kind === "unknown" || !c.name) {
        return c;
      }
      const q = [c.name, c.neighborhood, c.city, c.country].filter(Boolean).join(", ");
      try {
        const matches = await textSearch(q, 3);
        return { ...c, matches };
      } catch (err) {
        if (err instanceof PlacesNotConfigured) {
          return {
            ...c,
            cues: [...c.cues, "Places lookup unavailable — search to confirm"],
          };
        }
        return {
          ...c,
          cues: [...c.cues, `Places lookup failed: ${(err as Error).message}`],
        };
      }
    }),
  );
  return { ...extraction, candidates };
}

export async function processCapture(id: string, images: { mime: string; bytes: Buffer }[]) {
  const col = await captures();
  const _id = new ObjectId(id);
  try {
    let extraction: Extraction;
    const rec = (await col.findOne({ _id })) as CaptureRecord | null;
    if (rec?.pastedUrl && !images.length) {
      const parsed = classifyUrl(rec.pastedUrl);
      extraction = {
        summary: `Pasted ${parsed?.sourceHint || "url"} — parsed public venue URL, not a live booking grid.`,
        candidates: [
          {
            kind: parsed?.sourceHint === "google_maps" ? "place" : "restaurant",
            name: parsed?.displayName || parsed?.query || rec.pastedUrl,
            city: parsed?.city,
            neighborhood: undefined,
            country: undefined,
            cues: ["pasted URL", parsed?.sourceHint || "other"],
            confidence: 0.8,
            sourceHint: parsed?.sourceHint || "other",
            matches: [],
          },
        ],
      };
    } else if (images.length) {
      extraction = await extractFromImages(images);
    } else {
      extraction = mockExtraction();
    }
    extraction = await resolveMatches(extraction);
    await col.updateOne(
      { _id },
      { $set: { status: "needs_confirm", extraction, updatedAt: new Date(), error: undefined } },
    );
  } catch (err) {
    await col.updateOne(
      { _id },
      {
        $set: {
          status: "failed",
          error: (err as Error).message,
          updatedAt: new Date(),
        },
      },
    );
  }
}
