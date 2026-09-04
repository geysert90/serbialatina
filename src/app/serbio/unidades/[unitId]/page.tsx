import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { connection } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { getEntriesByUnit, getEntryAudioUrl, getAllUnits } from "@/lib/learn/directus";
import { LessonFlow } from "@/components/learn/lesson-flow";

export default function UnitLessonPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UnitLessonContent params={params} />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 py-12">
      <div className="h-8 w-48 animate-pulse rounded-xl bg-amber-100" />
      <div className="h-64 w-full max-w-sm animate-pulse rounded-3xl bg-amber-50" />
    </section>
  );
}

async function UnitLessonContent({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  await connection();
  const user = await getSessionUser();
  if (!user) {
    redirect("/acceso?redirect=/serbio/unidades");
  }

  const { unitId } = await params;
  const unitIdNum = parseInt(unitId, 10);

  if (isNaN(unitIdNum)) {
    redirect("/serbio/unidades");
  }

  let entries;
  try {
    entries = await getEntriesByUnit(unitIdNum);
  } catch {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 py-20 text-center">
        <p className="text-2xl">😕</p>
        <h1 className="text-2xl font-semibold text-black">
          Unidad no encontrada
        </h1>
        <p className="text-black/50">
          Esta unidad no existe o no tiene entradas disponibles.
        </p>
        <Link
          href="/serbio/unidades"
          className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white"
        >
          Volver a unidades
        </Link>
      </section>
    );
  }

  if (entries.length === 0) {
    redirect("/serbio/unidades");
  }

  const audioUrls: Record<number, string> = {};
  for (const entry of entries) {
    if (entry.audio_file) {
      audioUrls[entry.id] = getEntryAudioUrl(entry.audio_file);
    }
  }

  const units = await getAllUnits("starter");
  const unitLabel = units.find((u) => u.id === unitIdNum)?.label ?? `Unidad ${unitIdNum}`;

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 md:px-8 md:py-12">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/serbio/unidades"
            className="text-sm text-black/40 transition hover:text-black/70"
          >
            ← Unidades
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-black md:text-3xl">
            {unitLabel}
          </h1>
          <p className="text-sm text-black/45">
            {entries.length} {entries.length === 1 ? "entrada" : "entradas"}
          </p>
        </div>
      </div>

      <LessonFlow entries={entries} unitId={unitIdNum} audioUrls={audioUrls} />

      <style>{`
        @keyframes confetti-fall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(100vh) rotate(720deg); }
        }
      `}</style>
    </section>
  );
}
