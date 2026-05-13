import { type NextRequest, NextResponse } from "next/server";

import { loadPushSubscriptions } from "@/lib/push";
import { getPushHistory } from "../history";

export async function GET() {
  const subs = await loadPushSubscriptions();
  const history = await getPushHistory(20);

  return NextResponse.json({
    subscriberCount: subs.length,
    subscribers: subs.map((s) => ({
      endpoint: s.endpoint.slice(0, 48) + "…",
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      userAgent: s.userAgent ?? null,
    })),
    history,
    admin: true,
  });
}
