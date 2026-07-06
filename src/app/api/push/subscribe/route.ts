import { type NextRequest, NextResponse } from "next/server";

import { upsertPushSubscription } from "@/lib/push";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      subscription?: unknown;
      userAgent?: string;
    };

    const saved = await upsertPushSubscription(body.subscription, {
      userAgent: body.userAgent ?? request.headers.get("user-agent") ?? undefined,
    });

    if (!saved) {
      return NextResponse.json(
        { error: "Invalid push subscription." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
