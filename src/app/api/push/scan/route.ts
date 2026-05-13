import { type NextRequest, NextResponse } from "next/server";

import { isPushConfigured, scanAndNotifyNewWordPressPosts } from "@/lib/push";

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
      { error: "Push scan secret is not configured." },
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
      force?: boolean;
      limit?: number;
      categorySlugs?: string[];
    };

    const result = await scanAndNotifyNewWordPressPosts({
      force: Boolean(body.force),
      limit: typeof body.limit === "number" ? body.limit : undefined,
      categorySlugs: Array.isArray(body.categorySlugs) ? body.categorySlugs : undefined,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
