// ── User progress persistence (server-side JSON files) ────────────────

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

import { computeStreak } from "./streak";
import type { UserProgress, UnitProgress } from "./types";
import { MAX_HEARTS } from "./types";

const DATA_DIR = resolve(process.cwd(), "data", "learn-progress");
const HEARTS_REFILL_MINUTES = 30; // 1 heart every 30 minutes

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
    hearts: MAX_HEARTS,
    heartsRefillAt: null,
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
      hearts: parsed.hearts ?? MAX_HEARTS,
      heartsRefillAt: parsed.heartsRefillAt ?? null,
    };
  } catch {
    return emptyProgress();
  }
}

function writeProgress(userId: string, progress: UserProgress): void {
  ensureDataDir();
  writeFileSync(filePath(userId), JSON.stringify(progress, null, 2), "utf-8");
}

/** Recalculate hearts based on elapsed time since last refill. */
function refillHeartsIfNeeded(progress: UserProgress): UserProgress {
  if (progress.hearts >= MAX_HEARTS) {
    progress.heartsRefillAt = null;
    return progress;
  }

  if (!progress.heartsRefillAt) return progress;

  const elapsed = Date.now() - new Date(progress.heartsRefillAt).getTime();
  const heartsToAdd = Math.floor(elapsed / (HEARTS_REFILL_MINUTES * 60 * 1000));

  if (heartsToAdd > 0) {
    progress.hearts = Math.min(progress.hearts + heartsToAdd, MAX_HEARTS);
    if (progress.hearts >= MAX_HEARTS) {
      progress.heartsRefillAt = null;
    } else {
      progress.heartsRefillAt = new Date(
        Date.now() - (elapsed % (HEARTS_REFILL_MINUTES * 60 * 1000))
      ).toISOString();
    }
  }

  return progress;
}

// ── Public API ────────────────────────────────────────────────────────

/** Get the full progress object for a user (WordPress user ID). */
export function getProgress(userId: string): UserProgress {
  const progress = readProgress(userId);
  return refillHeartsIfNeeded(progress);
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
  const completed = progress.completedEntries.filter((entryId) => {
    // We don't have the full entry list here, so count direct matches
    return typeof entryId === "number";
  }).length;

  // More accurate: count from completedEntries that belong to this unit
  // For now use a simplified approach
  return {
    unitId,
    completed: progress.completedEntries.length,
    total: totalEntries,
    percentage:
      totalEntries > 0
        ? Math.round((progress.completedEntries.length / totalEntries) * 100)
        : 0,
  };
}

/** Count completed entries for a user. */
export function countCompleted(userId: string): number {
  const progress = readProgress(userId);
  return progress.completedEntries.length;
}

export function countCompletedForUnit(
  userId: string,
  _unitId: number,
): number {
  const progress = readProgress(userId);
  return progress.completedEntries.length;
}

/** Deduct a heart. Returns { hearts, gameOver } or null if already at 0. */
export function deductHeart(
  userId: string,
): { hearts: number; gameOver: boolean } | null {
  const progress = refillHeartsIfNeeded(readProgress(userId));

  if (progress.hearts <= 0) {
    return { hearts: 0, gameOver: true };
  }

  progress.hearts -= 1;

  // Start refill timer if not already running and below max
  if (progress.hearts < MAX_HEARTS && !progress.heartsRefillAt) {
    progress.heartsRefillAt = new Date().toISOString();
  }

  writeProgress(userId, progress);
  return { hearts: progress.hearts, gameOver: progress.hearts <= 0 };
}

/** Add XP to user progress. */
export function addXp(userId: string, amount: number): UserProgress {
  const progress = readProgress(userId);
  progress.xp += amount;
  writeProgress(userId, progress);
  return progress;
}

/** Refill all hearts (e.g., via shop or ad). */
export function refillHearts(userId: string): UserProgress {
  const progress = readProgress(userId);
  progress.hearts = MAX_HEARTS;
  progress.heartsRefillAt = null;
  writeProgress(userId, progress);
  return progress;
}
