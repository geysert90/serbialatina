// ── User progress persistence (server-side JSON files) ────────────────

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

import { computeStreak } from "./streak";
import type { UserProgress, UnitProgress } from "./types";

const DATA_DIR = resolve(process.cwd(), "data", "learn-progress");

function ensureDataDir(): void {
  mkdirSync(DATA_DIR, { recursive: true });
}

function filePath(userId: string): string {
  return resolve(DATA_DIR, `${userId}.json`);
}

// ── Read / Write ──────────────────────────────────────────────────────

function emptyProgress(): UserProgress {
  return {
    completedEntries: [],
    completedUnits: [],
    streak: { count: 0, lastDate: null },
    xp: 0,
  };
}

function readProgress(userId: string): UserProgress {
  ensureDataDir();
  try {
    const raw = readFileSync(filePath(userId), "utf-8");
    const parsed = JSON.parse(raw) as Partial<UserProgress>;
    return {
      completedEntries: parsed.completedEntries ?? [],
      completedUnits: parsed.completedUnits ?? [],
      streak: {
        count: parsed.streak?.count ?? 0,
        lastDate: parsed.streak?.lastDate ?? null,
      },
      xp: parsed.xp ?? 0,
    };
  } catch {
    return emptyProgress();
  }
}

function writeProgress(userId: string, progress: UserProgress): void {
  ensureDataDir();
  writeFileSync(filePath(userId), JSON.stringify(progress, null, 2), "utf-8");
}

// ── Public API ────────────────────────────────────────────────────────

/** Get the full progress object for a user (WordPress user ID). */
export function getProgress(userId: string): UserProgress {
  return readProgress(userId);
}

/** Mark a single entry as completed. Awards 10 XP. Returns updated progress. */
export function markEntryComplete(
  userId: string,
  entryId: number,
): UserProgress {
  const progress = readProgress(userId);

  if (!progress.completedEntries.includes(entryId)) {
    progress.completedEntries.push(entryId);
    progress.xp += 10;
  }

  const newStreak = computeStreak(progress.streak);
  progress.streak = newStreak;

  writeProgress(userId, progress);
  return progress;
}

/** Mark an entire unit as completed. */
export function markUnitComplete(
  userId: string,
  unitId: number,
): UserProgress {
  const progress = readProgress(userId);

  if (!progress.completedUnits.includes(unitId)) {
    progress.completedUnits.push(unitId);
  }

  writeProgress(userId, progress);
  return progress;
}

/** Get progress for a specific unit (used for progress bars in unit cards). */
export function getUnitProgress(
  userId: string,
  unitId: number,
  totalEntries: number,
): UnitProgress {
  const progress = readProgress(userId);

  // Entries in this unit that are marked complete.
  // We approximate by intersecting completedEntries with what we know.
  // For accurate per-unit tracking, the page component passes the entries list.
  // Here we just return the structure — the caller provides the actual count.

  return {
    unitId,
    completed: 0, // filled by caller
    total: totalEntries,
    percentage: 0, // filled by caller
  };
}

/** Check if all entries in a unit are completed. */
export function isUnitComplete(
  userId: string,
  unitEntryIds: number[],
): boolean {
  const progress = readProgress(userId);
  return unitEntryIds.every((id) => progress.completedEntries.includes(id));
}

/** Count how many of the given entries the user has completed. */
export function countCompleted(
  userId: string,
  entryIds: number[],
): number {
  const progress = readProgress(userId);
  return entryIds.filter((id) => progress.completedEntries.includes(id)).length;
}
