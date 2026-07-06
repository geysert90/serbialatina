"use server";

import { getSessionUser } from "@/lib/auth/session";
import {
  markEntryComplete,
  markUnitComplete,
  deductHeart,
  addXp,
  refillHearts,
  getProgress,
} from "@/lib/learn/progress-store";

// ── Progress actions ──────────────────────────────────────────────────

export async function completeEntryAction(
  entryId: number,
  unitId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getSessionUser();

  if (!user) {
    return { ok: false, error: "Debes iniciar sesión para registrar progreso." };
  }

  try {
    markEntryComplete(user.id, entryId);
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al guardar progreso.";
    return { ok: false, error: message };
  }
}


export async function completeUnitAction(
  unitId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getSessionUser();

  if (!user) {
    return { ok: false, error: "Debes iniciar sesión para registrar progreso." };
  }

  try {
    markUnitComplete(user.id, unitId);
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al guardar progreso.";
    return { ok: false, error: message };
  }
}


// ── Challenge / Gamification actions ───────────────────────────────────

export async function deductHeartAction(): Promise<
  { ok: true; hearts: number; gameOver: boolean } | { ok: false; error: string }
> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  try {
    const result = deductHeart(user.id);
    if (!result) {
      return { ok: true, hearts: 0, gameOver: true };
    }
    return { ok: true, hearts: result.hearts, gameOver: result.gameOver };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al descontar corazón.",
    };
  }
}

export async function addXpAction(
  amount: number,
): Promise<{ ok: true; xp: number } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  try {
    const progress = addXp(user.id, amount);
    return { ok: true, xp: progress.xp };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al añadir XP.",
    };
  }
}

export async function getHeartsAction(): Promise<
  { ok: true; hearts: number } | { ok: false; error: string }
> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  try {
    const progress = getProgress(user.id);
    return { ok: true, hearts: progress.hearts };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al obtener corazones.",
    };
  }
}

export async function refillHeartsAction(): Promise<
  { ok: true; hearts: number } | { ok: false; error: string }
> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  try {
    const progress = refillHearts(user.id);
    return { ok: true, hearts: progress.hearts };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al recargar corazones.",
    };
  }
}

