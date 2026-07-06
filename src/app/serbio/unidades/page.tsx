import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { connection } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { getAllUnits, getEntriesByUnit } from "@/lib/learn/directus";
import { getProgress } from "@/lib/learn/progress-store";

export default function UnidadesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UnidadesContent />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 md:px-8 md:py-12">
      <div className="h-10 w-48 animate-pulse rounded-xl bg-amber-100" />
      <div className="h-2 w-full animate-pulse rounded-full bg-amber-100" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-amber-50" />
        ))}
      </div>
    </section>
  );
}

async function UnidadesContent() {
  await connection();

  const user = await getSessionUser();
  if (!user) {
    redirect("/acceso?redirect=/serbio/unidades");
  }

  const units = await getAllUnits("starter");
  const progress = getProgress(user.id);

  const unitsWithProgress = await Promise.all(
    units.map(async (unit) => {
      let completed = 0;
      try {
        const entries = await getEntriesByUnit(unit.id);
        const entryIds = entries.map((e) => e.id);
        completed = entryIds.filter((id) =>
          progress.completedEntries.includes(id),
        ).length;
      } catch {
        // Unit fetch failed — show 0
      }
      const percentage = unit.count > 0 ? Math.round((completed / unit.count) * 100) : 0;
      return { ...unit, completed, percentage };
    }),
  );

  const totalCompleted = progress.completedEntries.length;
  const totalEntries = units.reduce((sum, u) => sum + u.count, 0);

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-black md:text-4xl">
          Unidades
        </h1>
        <p className="text-black/50">
          {totalCompleted} de {totalEntries} completadas
        </p>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-amber-100">
        <div
          className="h-full rounded-full bg-amber-500 transition-all duration-700"
          style={{
            width: `${totalEntries > 0 ? Math.round((totalCompleted / totalEntries) * 100) : 0}%`,
          }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {unitsWithProgress.map((unit, index) => (
          <Link
            key={unit.id}
            href={`/serbio/unidades/${unit.id}`}
            className="group rounded-2xl border border-black/10 bg-white p-5 transition hover:border-amber-300 hover:shadow-md"
            style={{
              animation: `fadeInUp 0.4s ease-out both`,
              animationDelay: `${index * 80}ms`,
            }}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-black">
                  {unit.label}
                </p>
                <p className="text-sm text-black/45">
                  {unit.count} {unit.count === 1 ? "entrada" : "entradas"}
                  {unit.completed > 0 && ` · ${unit.completed} aprendidas`}
                </p>
              </div>
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-amber-200 bg-amber-50 text-sm font-bold text-amber-700">
                {unit.percentage === 100 ? (
                  "✅"
                ) : (
                  <>{unit.percentage}%</>
                )}
              </div>
            </div>

            {unit.percentage > 0 && unit.percentage < 100 && (
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-amber-100">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-700"
                  style={{ width: `${unit.percentage}%` }}
                />
              </div>
            )}
          </Link>
        ))}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
