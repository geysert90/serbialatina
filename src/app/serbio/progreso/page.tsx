import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { getAllUnits, getEntriesByUnit } from "@/lib/learn/directus";
import { getProgress } from "@/lib/learn/progress-store";

export default function ProgressPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProgressContent />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 md:px-8 md:py-12">
      <div className="h-10 w-48 animate-pulse rounded-xl bg-amber-100" />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-amber-50" />
        ))}
      </div>
    </section>
  );
}

async function ProgressContent() {
  await connection();
  const user = await getSessionUser();
  if (!user) {
    redirect("/acceso?redirect=/serbio/progreso");
  }

  const progress = getProgress(user.id);
  const units = await getAllUnits("starter");

  const unitsWithProgress = await Promise.all(
    units.map(async (unit) => {
      try {
        const entries = await getEntriesByUnit(unit.id);
        const entryIds = entries.map((e) => e.id);
        const completed = entryIds.filter((id) =>
          progress.completedEntries.includes(id),
        ).length;
        const percentage =
          unit.count > 0 ? Math.round((completed / unit.count) * 100) : 0;
        return { ...unit, completed, percentage };
      } catch {
        return { ...unit, completed: 0, percentage: 0 };
      }
    }),
  );

  const totalCompleted = progress.completedEntries.length;
  const totalEntries = units.reduce((sum, u) => sum + u.count, 0);
  const overallPct =
    totalEntries > 0 ? Math.round((totalCompleted / totalEntries) * 100) : 0;

  const achievements = [
    { icon: "🥉", label: "Principiante", desc: "10 entradas", unlocked: totalCompleted >= 10 },
    { icon: "🥈", label: "Estudiante", desc: "50 entradas", unlocked: totalCompleted >= 50 },
    { icon: "🥇", label: "Experto", desc: "100 entradas", unlocked: totalCompleted >= 100 },
    { icon: "🔥", label: "Constante", desc: "3 días de racha", unlocked: progress.streak.count >= 3 },
    { icon: "🔥🔥", label: "Dedicado", desc: "7 días de racha", unlocked: progress.streak.count >= 7 },
    { icon: "🔥🔥🔥", label: "Imparable", desc: "30 días de racha", unlocked: progress.streak.count >= 30 },
  ];

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-black md:text-4xl">
          Tu progreso
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard value={`${progress.xp}`} label="XP total" />
        <StatCard value={`${progress.streak.count} 🔥`} label="Racha" />
        <StatCard value={`${totalCompleted}`} label="Entradas" />
        <StatCard value={`${overallPct}%`} label="Completado" />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-black">Por unidad</h2>
        <div className="space-y-3">
          {unitsWithProgress.map((unit) => (
            <div key={unit.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-black">{unit.label}</span>
                <span className="text-black/40 tabular-nums">
                  {unit.completed}/{unit.count}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-amber-100">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-700"
                  style={{ width: `${unit.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-black">Logros</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {achievements.map((a) => (
            <div
              key={a.label}
              className={`rounded-2xl border p-4 text-center transition ${
                a.unlocked
                  ? "border-amber-200 bg-amber-50/60"
                  : "border-black/5 bg-black/[0.02] opacity-40"
              }`}
            >
              <p className="text-2xl">{a.unlocked ? a.icon : "🔒"}</p>
              <p className="mt-1 text-sm font-semibold text-black">
                {a.label}
              </p>
              <p className="text-xs text-black/40">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-center">
      <p className="text-2xl font-bold text-amber-700">{value}</p>
      <p className="text-xs text-black/45">{label}</p>
    </div>
  );
}
