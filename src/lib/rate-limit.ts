import { mongoConfigured, getDb } from "./mongodb";

const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 20;

const memory = new Map<string, { start: number; count: number }>();

export async function assertCaptureRate(userId: string) {
  const now = Date.now();
  const windowStart = now - (now % WINDOW_MS);

  if (mongoConfigured()) {
    try {
      const db = await getDb();
      const col = db.collection("rateLimits");
      const rec = await col.findOneAndUpdate(
        { key: `capture:${userId}`, windowStart },
        { $inc: { count: 1 }, $setOnInsert: { key: `capture:${userId}`, windowStart } },
        { upsert: true, returnDocument: "after" },
      );
      const count = (rec?.count as number) || 1;
      if (count > LIMIT) {
        const err = new Error("Rate limit: 20 captures per hour. Try again later.");
        (err as Error & { status: number }).status = 429;
        throw err;
      }
      return;
    } catch (e) {
      if ((e as Error & { status?: number }).status === 429) throw e;
    }
  }

  const k = `capture:${userId}`;
  const cur = memory.get(k);
  if (!cur || now - cur.start > WINDOW_MS) {
    memory.set(k, { start: now, count: 1 });
    return;
  }
  cur.count += 1;
  if (cur.count > LIMIT) {
    const err = new Error("Rate limit: 20 captures per hour. Try again later.");
    (err as Error & { status: number }).status = 429;
    throw err;
  }
}
