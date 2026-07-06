// ── Directus audio proxy ──────────────────────────────────────────────
// GET /api/audio/[fileId] — streams audio from Directus to the browser.
// Keeps Directus internal; no CORS issues.

import { NextResponse, type NextRequest } from "next/server";

const DIRECTUS_URL =
  process.env.DIRECTUS_URL ?? "http://localhost:8055";

async function getToken(): Promise<string | null> {
  // 1. Environment variable (production standard)
  const token = process.env.DIRECTUS_TOKEN;
  if (token) return token;

  // 2. Secrets file fallback
  try {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    return readFileSync(
      resolve(process.cwd(), "scripts/.directus_token"),
      "utf-8",
    ).trim();
  } catch {
    return null;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;

  if (!fileId || fileId.length < 10) {
    return NextResponse.json({ error: "Invalid file ID" }, { status: 400 });
  }

  const token = await getToken();
  if (!token) {
    return NextResponse.json(
      { error: "Directus not configured" },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`${DIRECTUS_URL}/assets/${fileId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "SerbiaLatina-AudioProxy/1.0",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Directus returned ${res.status}` },
        { status: res.status },
      );
    }

    const contentType = res.headers.get("content-type") ?? "audio/mpeg";
    const contentLength = res.headers.get("content-length");

    return new NextResponse(res.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        ...(contentLength ? { "Content-Length": contentLength } : {}),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
