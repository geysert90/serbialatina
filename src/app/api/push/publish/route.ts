import { type NextRequest, NextResponse } from "next/server";

import {
  isPushConfigured,
  scanAndNotifyNewWordPressPosts,
  sendPushNotificationToAll,
} from "@/lib/push";

function getSecret(request: NextRequest): string {
  return (
    request.headers.get("x-push-secret") ??
    request.nextUrl.searchParams.get("secret") ??
    ""
  ).trim();
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.PUSH_SCAN_SECRET?.trim();
  if (!expectedSecret) {
    return NextResponse.json(
      { error: "Push secret is not configured." },
      { status: 500 },
    );
  }

  if (getSecret(request) !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: "Push notifications are not configured." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      title?: string;
      body?: string;
      url?: string;
      tag?: string;
      forceScan?: boolean;
      categorySlugs?: string[];
      limit?: number;
    };

    if (body.forceScan) {
      const result = await scanAndNotifyNewWordPressPosts({
        force: true,
        limit: typeof body.limit === "number" ? body.limit : undefined,
        categorySlugs: Array.isArray(body.categorySlugs) ? body.categorySlugs : undefined,
      });

      return NextResponse.json({ ok: true, mode: "scan", ...result });
    }

    const result = await sendPushNotificationToAll({
      title: body.title?.trim() || "Serbia Latina",
      body: body.body?.trim() || "Nueva publicación disponible.",
      url: body.url?.trim() || "/",
      tag: body.tag?.trim() || `serbialatina-published-${Date.now()}`,
      icon: "/icon-192-white.png",
      badge: "/icon-192-white.png",
    });

    return NextResponse.json({ ok: true, mode: "direct", ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
