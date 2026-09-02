import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { mongoConfigured } from "@/lib/mongodb";
import { listAlerts } from "@/lib/alerts";
import { alerts } from "@/lib/models";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const user = await requireUser();
    if (!mongoConfigured()) {
      return NextResponse.json({ alerts: [], unread: 0, live: false, warning: "MONGODB_URI is not set." });
    }
    const data = await listAlerts(user.userId);
    return NextResponse.json(data);
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = (await req.json()) as { id?: string; all?: boolean };
    const col = await alerts();
    if (body.all) {
      await col.updateMany({ userId: user.userId, read: false }, { $set: { read: true, updatedAt: new Date() } });
    } else if (body.id && ObjectId.isValid(body.id)) {
      await col.updateOne(
        { _id: new ObjectId(body.id), userId: user.userId },
        { $set: { read: true, updatedAt: new Date() } },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
