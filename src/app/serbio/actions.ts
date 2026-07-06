"use server";

import { getSessionUser } from "@/lib/auth/session";
import {
  markEntryComplete,
  markUnitComplete,
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
