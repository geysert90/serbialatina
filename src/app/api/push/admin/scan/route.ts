import { type NextRequest, NextResponse } from "next/server";

import {
  isPushConfigured,
  scanAndNotifyNewWordPressPosts,
} from "@/lib/push";

export async function POST(request: NextRequest) {
  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: "Push no configurado." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      force?: boolean;
      limit?: number;
      categorySlugs?: string[];
    };

    const result = await scanAndNotifyNewWordPressPosts({
      force: body.force !== false, // default true for admin
      limit: typeof body.limit === "number" ? body.limit : 20,
      categorySlugs: Array.isArray(body.categorySlugs) ? body.categorySlugs : undefined,
    });

    // Guardar historial
    if (result.notified > 0) {
      const { appendPushHistory } = await import("../history");
      for (const post of result.posts) {
        await appendPushHistory({
          title: "Serbia Latina",
          body: post.title,
          url: post.url,
          tag: `scan-post-${post.id}`,
          icon: "/icon-192-white.png",
          badge: "/icon-192-white.png",
          delivered: result.delivered,
          removed: result.removed,
          sentAt: new Date().toISOString(),
          source: "scan",
        });
      }
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
