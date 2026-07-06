import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import * as path from "node:path";

import webPush from "web-push";

import { stripHtml } from "@/lib/utils";

const WORDPRESS_API_BASE = (
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL ?? "https://admin.segun2idioma.com/wp-json"
).replace(/\/$/, "");

const PUSH_VAPID_PUBLIC_KEY = process.env.PUSH_VAPID_PUBLIC_KEY?.trim();
const PUSH_VAPID_PRIVATE_KEY = process.env.PUSH_VAPID_PRIVATE_KEY?.trim();
const PUSH_VAPID_SUBJECT = process.env.PUSH_VAPID_SUBJECT?.trim() ?? "mailto:info@serbialatina.com";
const PUSH_PROVIDER_API_KEY = process.env.PUSH_PROVIDER_API_KEY?.trim();
const PUSH_NOTIFY_CATEGORY_SLUGS = (process.env.PUSH_NOTIFY_CATEGORY_SLUGS ?? "noticias,eventos")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const PUSH_LIMIT = Number(process.env.PUSH_NOTIFY_LIMIT ?? "20") || 20;
const DATA_DIR = path.join(process.cwd(), ".data");
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, "push-subscriptions.json");
const STATE_FILE = path.join(DATA_DIR, "push-state.json");

export type BrowserPushSubscription = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type StoredPushSubscription = BrowserPushSubscription & {
  createdAt: string;
  updatedAt: string;
  userAgent?: string;
};

type PushState = {
  initialized: boolean;
  seenPostIds: number[];
  lastScannedAt?: string;
  lastNotifiedAt?: string;
};

type WordPressCategory = {
  id: number;
  name: string;
  slug: string;
};

type WordPressPost = {
  id: number;
  slug: string;
  date: string;
  link: string;
  categories: number[];
  title: { rendered: string };
  excerpt: { rendered: string };
};

export type PushNotificationPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
  icon?: string;
  badge?: string;
};

export type PushDeliverySummary = {
  delivered: number;
  removed: number;
  errors: Array<{ endpoint: string; error: string }>;
};

export type PushScanSummary = PushDeliverySummary & {
  initialized: boolean;
  scanned: number;
  matched: number;
  notified: number;
  skipped: number;
  categorySlugs: string[];
  posts: Array<{ id: number; slug: string; title: string; url: string }>;
};

function getVapidConfigured(): boolean {
  return Boolean(PUSH_VAPID_PUBLIC_KEY && PUSH_VAPID_PRIVATE_KEY);
}

function ensureVapidConfigured(): void {
  if (!getVapidConfigured()) {
    throw new Error("Push notifications are not configured yet.");
  }

  webPush.setVapidDetails(PUSH_VAPID_SUBJECT, PUSH_VAPID_PUBLIC_KEY!, PUSH_VAPID_PRIVATE_KEY!);
}

async function ensureDataDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await ensureDataDir();
  const tempPath = `${filePath}.${randomUUID()}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
  await rename(tempPath, filePath);
}

function normalizeSubscription(subscription: BrowserPushSubscription): BrowserPushSubscription {
  return {
    endpoint: subscription.endpoint.trim(),
    expirationTime: subscription.expirationTime ?? null,
    keys: {
      p256dh: subscription.keys.p256dh.trim(),
      auth: subscription.keys.auth.trim(),
    },
  };
}

function parseSubscription(raw: unknown): BrowserPushSubscription | null {
  if (!raw || typeof raw !== "object") return null;

  const maybe = raw as Partial<BrowserPushSubscription> & {
    keys?: Partial<BrowserPushSubscription["keys"]>;
  };

  if (
    typeof maybe.endpoint !== "string" ||
    !maybe.endpoint ||
    !maybe.keys ||
    typeof maybe.keys.p256dh !== "string" ||
    typeof maybe.keys.auth !== "string"
  ) {
    return null;
  }

  return normalizeSubscription({
    endpoint: maybe.endpoint,
    expirationTime: typeof maybe.expirationTime === "number" || maybe.expirationTime === null ? maybe.expirationTime : null,
    keys: {
      p256dh: maybe.keys.p256dh,
      auth: maybe.keys.auth,
    },
  });
}

export async function loadPushSubscriptions(): Promise<StoredPushSubscription[]> {
  return readJson<StoredPushSubscription[]>(SUBSCRIPTIONS_FILE, []);
}

export async function upsertPushSubscription(
  rawSubscription: unknown,
  options: { userAgent?: string } = {},
): Promise<StoredPushSubscription | null> {
  const subscription = parseSubscription(rawSubscription);
  if (!subscription) return null;

  const now = new Date().toISOString();
  const subscriptions = await loadPushSubscriptions();
  const index = subscriptions.findIndex((item) => item.endpoint === subscription.endpoint);
  const current = index >= 0 ? subscriptions[index] : null;
  const record: StoredPushSubscription = {
    ...subscription,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
    userAgent: options.userAgent?.trim() || current?.userAgent,
  };

  if (index >= 0) {
    subscriptions[index] = record;
  } else {
    subscriptions.push(record);
  }

  await writeJson(SUBSCRIPTIONS_FILE, subscriptions);
  return record;
}

export async function removePushSubscription(endpoint: string): Promise<boolean> {
  const trimmedEndpoint = endpoint.trim();
  const subscriptions = await loadPushSubscriptions();
  const filtered = subscriptions.filter((item) => item.endpoint !== trimmedEndpoint);

  if (filtered.length === subscriptions.length) {
    return false;
  }

  await writeJson(SUBSCRIPTIONS_FILE, filtered);
  return true;
}

async function loadPushState(): Promise<PushState> {
  return readJson<PushState>(STATE_FILE, {
    initialized: false,
    seenPostIds: [],
  });
}

async function savePushState(state: PushState): Promise<void> {
  await writeJson(STATE_FILE, state);
}

async function fetchWordPressJson<T>(pathname: string): Promise<T> {
  const response = await fetch(`${WORDPRESS_API_BASE}${pathname}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "SerbiaLatina-Push/1.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`WordPress returned ${response.status} for ${pathname}`);
  }

  return (await response.json()) as T;
}

async function getWordPressCategories(): Promise<WordPressCategory[]> {
  return fetchWordPressJson<WordPressCategory[]>(
    "/wp/v2/categories?per_page=100&orderby=id&order=asc&_fields=id,name,slug",
  );
}

async function getWordPressLatestPosts(limit: number): Promise<WordPressPost[]> {
  return fetchWordPressJson<WordPressPost[]>(
    `/wp/v2/posts?status=publish&per_page=${limit}&orderby=date&order=desc&_fields=id,slug,date,link,title,excerpt,categories`,
  );
}

function buildNotificationPayload(post: WordPressPost, categoryName: string): PushNotificationPayload {
  const title = stripHtml(post.title.rendered) || "Nueva publicación";
  const excerpt = stripHtml(post.excerpt.rendered);
  const body = excerpt || `${categoryName}: ${title}`;

  return {
    title: "Serbia Latina",
    body,
    url: post.link,
    tag: `serbialatina-post-${post.id}`,
    icon: "/icon-192-white.png",
    badge: "/icon-192-white.png",
  };
}

export async function sendPushNotificationToAll(
  payload: PushNotificationPayload,
): Promise<PushDeliverySummary> {
  ensureVapidConfigured();

  const subscriptions = await loadPushSubscriptions();
  if (!subscriptions.length) {
    return { delivered: 0, removed: 0, errors: [] };
  }

  const errors: Array<{ endpoint: string; error: string }> = [];
  const staleEndpoints = new Set<string>();
  let delivered = 0;

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(subscription, JSON.stringify(payload));
        delivered += 1;
      } catch (error) {
        const statusCode = typeof error === "object" && error && "statusCode" in error
          ? Number((error as { statusCode?: number }).statusCode)
          : undefined;
        const message = error instanceof Error ? error.message : "Unknown push error";

        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.add(subscription.endpoint);
        }

        errors.push({ endpoint: subscription.endpoint, error: message });
      }
    }),
  );

  if (staleEndpoints.size) {
    const filtered = subscriptions.filter((item) => !staleEndpoints.has(item.endpoint));
    await writeJson(SUBSCRIPTIONS_FILE, filtered);
  }

  return {
    delivered,
    removed: staleEndpoints.size,
    errors,
  };
}

export async function scanAndNotifyNewWordPressPosts(options: {
  force?: boolean;
  limit?: number;
  categorySlugs?: string[];
} = {}): Promise<PushScanSummary> {
  ensureVapidConfigured();

  const limit = options.limit ?? PUSH_LIMIT;
  const categorySlugs = (options.categorySlugs ?? PUSH_NOTIFY_CATEGORY_SLUGS)
    .map((slug) => slug.trim())
    .filter(Boolean);

  const categories = await getWordPressCategories();
  const categoryById = new Map(categories.map((category) => [category.id, category] as const));
  const targetCategoryIds = new Set(
    categories.filter((category) => categorySlugs.includes(category.slug)).map((category) => category.id),
  );

  const posts = await getWordPressLatestPosts(limit);
  const matchingPosts = posts
    .filter((post) => post.categories.some((categoryId) => targetCategoryIds.has(categoryId)))
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());

  const state = await loadPushState();
  const seenPostIds = new Set(state.seenPostIds);

  if (!state.initialized && !options.force) {
    await savePushState({
      initialized: true,
      seenPostIds: matchingPosts.map((post) => post.id),
      lastScannedAt: new Date().toISOString(),
    });

    return {
      initialized: true,
      scanned: posts.length,
      matched: matchingPosts.length,
      notified: 0,
      skipped: matchingPosts.length,
      categorySlugs,
      posts: matchingPosts.map((post) => ({
        id: post.id,
        slug: post.slug,
        title: stripHtml(post.title.rendered),
        url: post.link,
      })),
      delivered: 0,
      removed: 0,
      errors: [],
    };
  }

  const newPosts = matchingPosts.filter((post) => !seenPostIds.has(post.id));
  const deliveries: PushDeliverySummary = { delivered: 0, removed: 0, errors: [] };

  for (const post of newPosts) {
    const categoryName = post.categories
      .map((categoryId) => categoryById.get(categoryId)?.name)
      .find(Boolean) ?? "Nueva publicación";

    const payload = buildNotificationPayload(post, categoryName);
    const result = await sendPushNotificationToAll(payload);
    deliveries.delivered += result.delivered;
    deliveries.removed += result.removed;
    deliveries.errors.push(...result.errors);
    seenPostIds.add(post.id);
  }

  await savePushState({
    initialized: true,
    seenPostIds: Array.from(seenPostIds),
    lastScannedAt: new Date().toISOString(),
    lastNotifiedAt: newPosts.length ? new Date().toISOString() : state.lastNotifiedAt,
  });

  return {
    initialized: true,
    scanned: posts.length,
    matched: matchingPosts.length,
    notified: newPosts.length,
    skipped: matchingPosts.length - newPosts.length,
    categorySlugs,
    posts: newPosts.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: stripHtml(post.title.rendered),
      url: post.link,
    })),
    ...deliveries,
  };
}

export function getPushPublicKey(): string | null {
  return PUSH_VAPID_PUBLIC_KEY ?? null;
}

export function isPushConfigured(): boolean {
  return getVapidConfigured();
}

export function hasPushProviderApiKey(): boolean {
  return Boolean(PUSH_PROVIDER_API_KEY);
}
