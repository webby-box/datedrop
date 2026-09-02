import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { mongoConfigured } from "@/lib/mongodb";
import { boards, boardPlaces, places, plans } from "@/lib/models";
import { placeIdsLookupFilter, placeIdOf } from "@/lib/places";
import { conciergeChat } from "@/lib/llm";
import { listAlerts } from "@/lib/alerts";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = (await req.json()) as { message?: string };
    const message = String(body.message || "").trim();
    if (!message) {
      return NextResponse.json({ error: "Ask Aura anything about your vault or plans." }, { status: 400 });
    }

    let context = "No vault data yet.";
    if (mongoConfigured()) {
      const boardList = await (await boards()).find({ userId: user.userId }).limit(8).toArray();
      const bp = await boardPlaces();
      const pl = await places();
      const lines: string[] = [];
      for (const b of boardList) {
        const links = await bp.find({ boardId: b._id!.toString() }).toArray();
        const saved = await pl.find(placeIdsLookupFilter(links.map((l) => l.placeId))).toArray();
        lines.push(
          `Plan/board ${b.title} (${b.city}) dates ${b.startDate || "unset"}→${b.endDate || "unset"} party ${b.partySize}: ` +
            saved.map((p) => `${p.name} [${placeIdOf(p)}]`).join("; "),
        );
        const plan = await (await plans()).findOne({ boardId: b._id!.toString(), userId: user.userId });
        if (plan) lines.push(`Existing plan seasonality: ${plan.seasonality?.verdict} — ${plan.seasonality?.prose}`);
      }
      const { alerts: alertRows } = await listAlerts(user.userId, 8);
      if (alertRows.length) {
        lines.push(
          "Recent alerts: " +
            alertRows.map((a) => `${a.title}: ${a.subtitle}`).join(" | "),
        );
      }
      if (lines.length) context = lines.join("\n");
    }

    const reply = await conciergeChat({ message, context });
    return NextResponse.json({ reply });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
