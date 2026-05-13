import { type NextRequest, NextResponse } from "next/server";

import {
  isPushConfigured,
  sendPushNotificationToAll,
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
      title?: string;
      body?: string;
      url?: string;
      tag?: string;
    };

    const payload = {
      title: body.title?.trim() || "Serbia Latina",
      body: body.body?.trim() || "Nueva publicación disponible.",
      url: body.url?.trim() || "/",
      tag: body.tag?.trim() || `admin-send-${Date.now()}`,
      icon: "/icon-192-white.png",
      badge: "/icon-192-white.png",
    };

    const result = await sendPushNotificationToAll(payload);

    // Guardar historial
    const { appendPushHistory } = await import("../history");
    await appendPushHistory({ ...payload, ...result, sentAt: new Date().toISOString() });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
