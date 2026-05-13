import { readFile } from "node:fs/promises";
import * as path from "node:path";

import { type NextRequest, NextResponse } from "next/server";

import { getUserProfile } from "../../../../lib/auth/profile-store";

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

async function readPhotoBytes(coverPhotoUrl: string): Promise<{ bytes: Buffer; contentType: string }> {
  const relativePath = coverPhotoUrl.startsWith("/") ? coverPhotoUrl.slice(1) : coverPhotoUrl;
  const publicPath = path.join(process.cwd(), "public", relativePath);
  const bytes = await readFile(publicPath);

  return {
    bytes,
    contentType: getContentType(publicPath),
  };
}

export async function GET(_request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const { userId } = await context.params;
  const profile = await getUserProfile(userId);

  if (!profile?.coverPhotoUrl) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  try {
    const { bytes, contentType } = await readPhotoBytes(profile.coverPhotoUrl);

    return new Response(bytes as unknown as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }
}
