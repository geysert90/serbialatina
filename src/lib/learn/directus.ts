// ── Directus client (server-side only) ──────────────────────────────────

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { LearningEntry, UnitInfo } from "./types";

const DIRECTUS_URL =
  process.env.DIRECTUS_URL ?? "http://localhost:8055";

function getToken(): string {
  // 1. Environment variable (production standard)
  const token = process.env.DIRECTUS_TOKEN;
  if (token) return token;

  // 2. Secrets file bridge (for servers where env is not yet configured)
  try {
    const secretPath = resolve(
      process.cwd(),
      "scripts/.directus_token",
    );
    const fileToken = readFileSync(secretPath, "utf-8").trim();
    if (fileToken) return fileToken;
  } catch {
    // File doesn't exist or can't be read — fall through
  }

  throw new Error("DIRECTUS_TOKEN environment variable is not set");
}

// ── Reusable fetch helper ──────────────────────────────────────────────

async function directusFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${DIRECTUS_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "User-Agent": "SerbiaLatina-Learn/1.0",
      Accept: "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    },
    // Next.js 16: no-store ensures fresh data for learning progress queries.
    // directusFetch is internal server code, so cache is fine for read-heavy endpoints
    // but we keep it simple — learning content is read-mostly, CDN cache on Directus side.
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Directus API error ${res.status} for ${path}: ${body.slice(0, 300)}`,
    );
  }

  return res.json() as Promise<T>;
}

type DirectusListResponse<T> = {
  data: T[];
};

// ── Learning entries ───────────────────────────────────────────────────

/** Fetch all published entries for a given unit, sorted by `sort`. */
export async function getEntriesByUnit(
  unitId: number,
): Promise<LearningEntry[]> {
  const params = new URLSearchParams({
    "filter[unit][_eq]": String(unitId),
    "filter[status][_eq]": "published",
    sort: "sort",
    limit: "200",
    fields:
      "id,status,sort,unit,slug,entry_type,difficulty,part_of_speech," +
      "serbian_latin,serbian_cyrillic,spanish_translation," +
      "pronunciation_hint,literal_translation,grammatical_gender," +
      "example_latin,example_cyrillic,example_spanish," +
      "usage_notes,audio_file",
  });

  const result = await directusFetch<DirectusListResponse<LearningEntry>>(
    `/items/learning_entries?${params}`,
  );

  return result.data;
}

/** Fetch all distinct units with their entry counts, sorted by unit id. */
export async function getAllUnits(
  difficulty: string = "starter",
): Promise<UnitInfo[]> {
  // Get distinct unit IDs and counts
  const params = new URLSearchParams({
    "filter[status][_eq]": "published",
    "filter[difficulty][_eq]": difficulty,
    "aggregate[count]": "id",
    "groupBy[]": "unit",
    sort: "unit",
    limit: "50",
  });

  const result = await directusFetch<
    DirectusListResponse<{ unit: number; count: { id: number } }>
  >(`/items/learning_entries?${params}`);

  // Map unit IDs to human labels
  const UNIT_LABELS: Record<number, string> = {
    1: "Primeros pasos",
    4: "Vocabulario básico",
    5: "Frases útiles",
    6: "El calendario",
    7: "La familia",
    8: "Los números",
    9: "El cuerpo",
    23: "En contexto",
  };

  return result.data.map((row) => ({
    id: row.unit,
    count: row.count.id,
    label:
      UNIT_LABELS[row.unit] ??
      `Unidad ${row.unit}`,
  }));
}

/** Build a proxied audio URL (via /api/audio/[fileId]) for client-side playback. */
export function getEntryAudioUrl(fileId: string): string {
  return `/api/audio/${fileId}`;
}
