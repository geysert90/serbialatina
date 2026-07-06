import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  countWords,
  estimateReadingMinutes,
  getReadingSources,
  type ReadingKind,
  type ReadingSource,
} from "./reading-library";

const DIRECTUS_URL = process.env.DIRECTUS_URL ?? "http://localhost:8055";
const READING_CATEGORY: Record<ReadingKind, string> = {
  revista: "Revista",
  libro: "Libro",
  video: "Video",
};

function getToken(): string {
  const token = process.env.DIRECTUS_TOKEN;
  if (token) return token;

  try {
    const secretPath = resolve(process.cwd(), "scripts/.directus_token");
    const fileToken = readFileSync(secretPath, "utf-8").trim();
    if (fileToken) return fileToken;
  } catch {
    // Ignore; we'll fail below with a clear message.
  }

  throw new Error("DIRECTUS_TOKEN environment variable is not set");
}

type DirectusResponse<T> = {
  data: T[];
};

type DirectusLesson = {
  id: number;
  slug: string;
  title: string;
  summary?: string | null;
  topic?: string | null;
  category?: string | null;
  content?: string | null;
  status?: string | null;
  sort?: number | null;
};

async function directusFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: "application/json",
      "User-Agent": "SerbiaLatina-Reading/1.0",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Directus API error ${res.status} for ${path}: ${body.slice(0, 240)}`,
    );
  }

  return (await res.json()) as T;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(x?[0-9a-fA-F]+);/g, (match, value) => {
      if (typeof value !== "string") return match;
      const codePoint = value.startsWith("x") || value.startsWith("X")
        ? Number.parseInt(value.slice(1), 16)
        : Number.parseInt(value, 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    });
}

function contentToParagraphs(content?: string | null): string[] {
  if (!content) return [];

  const rawParagraphs = content.includes("<p")
    ? Array.from(content.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)).map((match) => match[1])
    : content.split(/\n\s*\n/g);

  const paragraphs = rawParagraphs
    .map((paragraph) => stripHtml(paragraph).replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (paragraphs.length > 0) {
    return paragraphs;
  }

  return [stripHtml(content).replace(/\s+/g, " ").trim()].filter(Boolean);
}

function toneForIndex(index: number): string {
  const tones = [
    "from-sky-100 via-white to-amber-100",
    "from-amber-100 via-white to-rose-100",
    "from-emerald-100 via-white to-cyan-100",
    "from-violet-100 via-white to-pink-100",
  ];

  return tones[index % tones.length];
}

function toReadingSource(item: DirectusLesson, index: number, kind: ReadingKind): ReadingSource {
  const paragraphs = contentToParagraphs(item.content);
  const joinedText = paragraphs.join(" ");
  return {
    kind,
    slug: item.slug,
    title: item.title,
    subtitle: item.summary?.trim() || item.topic?.trim() || "Lectura interactiva",
    sourceName: item.category?.trim() || "Directus",
    sourceUrl: undefined,
    topic: item.topic?.trim() || item.category?.trim() || READING_CATEGORY[kind],
    readingMinutes: Math.max(1, item.sort ?? estimateReadingMinutes(joinedText || item.title)),
    tone: toneForIndex(index),
    paragraphs,
  };
}

export async function getDirectusReadingSources(kind: ReadingKind): Promise<ReadingSource[]> {
  const category = READING_CATEGORY[kind];
  const params = new URLSearchParams({
    "filter[status][_eq]": "published",
    "filter[category][_eq]": category,
    sort: "sort",
    limit: "50",
    fields: "id,slug,title,summary,topic,category,content,status,sort",
  });

  try {
    const result = await directusFetch<DirectusResponse<DirectusLesson>>(
      `/items/language_lessons?${params.toString()}`,
    );

    if (!result.data.length) {
      return getReadingSources(kind);
    }

    return result.data
      .filter((item) => item.slug && item.title)
      .map((item, index) => toReadingSource(item, index, kind));
  } catch {
    return getReadingSources(kind);
  }
}

export async function getDirectusReadingSourceBySlug(
  kind: ReadingKind,
  slug: string,
): Promise<ReadingSource | undefined> {
  const sources = await getDirectusReadingSources(kind);
  return sources.find((source) => source.slug === slug);
}

export async function getDirectusFeaturedReading(kind: ReadingKind): Promise<ReadingSource | undefined> {
  const sources = await getDirectusReadingSources(kind);
  return sources[0];
}

export function countReadingWords(source: ReadingSource): number {
  return countWords(source.paragraphs.join(" "));
}
