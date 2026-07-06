// ── Daily streak logic ─────────────────────────────────────────────────

export type StreakState = {
  count: number;
  lastDate: string | null; // "YYYY-MM-DD"
};

function todayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const aUtc = Date.UTC(ay, am - 1, ad);
  const bUtc = Date.UTC(by, bm - 1, bd);
  return Math.floor((bUtc - aUtc) / 86_400_000);
}

/**
 * Compute the new streak state after user activity today.
 *
 * Rules:
 * - First activity ever → streak = 1
 * - Already active today → no change
 * - Active yesterday → increment streak
 * - Missed a day → reset to 1
 */
export function computeStreak(current: StreakState): StreakState {
  const today = todayStr();

  if (!current.lastDate) {
    return { count: 1, lastDate: today };
  }

  if (current.lastDate === today) {
    return current; // already counted today
  }

  const diff = daysBetween(current.lastDate, today);

  if (diff === 1) {
    return { count: current.count + 1, lastDate: today };
  }

  // Missed one or more days
  return { count: 1, lastDate: today };
}
