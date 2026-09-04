import { type NextRequest, NextResponse } from "next/server";
import { stripHtml } from "@/lib/utils";
import {
  isPushConfigured,
  sendPushNotificationToAll,
} from "@/lib/push";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const WORDPRESS_API_BASE = (
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL ?? "https://admin.serbialatina.com/wp-json"
).replace(/\/$/, "");

const CATEGORY_SLUGS = (process.env.PUSH_NOTIFY_CATEGORY_SLUGS ?? "noticias,eventos")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const STATE_FILE = path.join(process.cwd(), ".data", "push-state.json");

function getSecret(request: NextRequest): string {
  return (
    request.headers.get("x-push-secret") ??
    request.nextUrl.searchParams.get("secret") ??
    ""
  ).trim();
}

async function getState(): Promise<{ seenPostIds: number[] }> {
  try {
    const raw = await readFile(STATE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { seenPostIds: [] };
  }
}

async function saveState(state: { seenPostIds: number[] }): Promise<void> {
  const { mkdir, rename } = await import("node:fs/promises");
  await mkdir(path.dirname(STATE_FILE), { recursive: true });
  const tmp = `${STATE_FILE}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify({ seenPostIds: state.seenPostIds, initialized: true }, null, 2), "utf-8");
  await rename(tmp, STATE_FILE);
}

async function fetchPostCategories(postId: number): Promise<number[]> {
  const res = await fetch(
    `${WORDPRESS_API_BASE}/wp/v2/posts/${postId}?_fields=categories`,
    { headers: { Accept: "application/json" }, cache: "no-store" },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { categories?: number[] };
  return data.categories ?? [];
}

async function fetchCategorySlugs(ids: number[]): Promise<string[]> {
  if (!ids.length) return [];
  const res = await fetch(
    `${WORDPRESS_API_BASE}/wp/v2/categories?include=${ids.join(",")}&_fields=slug`,
    { headers: { Accept: "application/json" }, cache: "no-store" },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{ slug: string }>;
  return data.map((c) => c.slug);
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.PUSH_SCAN_SECRET?.trim();
  if (!expectedSecret) {
    return NextResponse.json({ error: "Secret no configurado" }, { status: 500 });
  }

  if (getSecret(request) !== expectedSecret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push no configurado" }, { status: 503 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      post_id?: number;
      id?: number;
      title?: string | { rendered?: string };
      link?: string;
      categories?: number[];
      post_type?: string;
    };

    const postId = body.post_id ?? body.id;
    if (!postId || typeof postId !== "number") {
      return NextResponse.json(
        { error: "Falta post_id o id en el body" },
        { status: 400 },
      );
    }

    if (body.post_type && body.post_type !== "post") {
      return NextResponse.json({
        ok: true, skipped: true,
        reason: `post_type=${body.post_type} (solo 'post')`,
      });
    }

    let categoryIds: number[] = body.categories ?? [];
    if (!categoryIds.length) {
      categoryIds = await fetchPostCategories(postId);
    }
    if (!categoryIds.length) {
      return NextResponse.json({ ok: true, skipped: true, reason: "sin categorías" });
    }

    const slugs = await fetchCategorySlugs(categoryIds);
    const matchedSlug = slugs.find((slug) => CATEGORY_SLUGS.includes(slug));
    if (!matchedSlug) {
      return NextResponse.json({
        ok: true, skipped: true,
        reason: `categorías [${slugs.join(",")}] != [${CATEGORY_SLUGS.join(",")}]`,
      });
    }

    const state = await getState();
    if (state.seenPostIds.includes(postId)) {
      return NextResponse.json({
        ok: true, skipped: true,
        reason: `post ${postId} ya notificado`,
      });
    }

    const titleText =
      typeof body.title === "string"
        ? body.title
        : typeof body.title?.rendered === "string"
          ? stripHtml(body.title.rendered)
          : "Nueva publicación";

    const postLink = body.link ?? `https://serbialatina.com/?p=${postId}`;

    const result = await sendPushNotificationToAll({
      title: "Serbia Latina",
      body: titleText,
      url: postLink,
      tag: `wp-webhook-${postId}`,
      icon: "/icon-192-white.png",
      badge: "/icon-192-white.png",
    });

    state.seenPostIds.push(postId);
    await saveState(state);

    return NextResponse.json({
      ok: true,
      post_id: postId,
      title: titleText.slice(0, 80),
      category: matchedSlug,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
