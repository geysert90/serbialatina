import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { connection } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { getAllUnits, getEntriesByUnit, getEntryAudioUrl } from "@/lib/learn/directus";
import { FlashcardDeck } from "./deck";

export default function FlashcardsPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string }>;
}) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <FlashcardsContent searchParams={searchParams} />
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

async function FlashcardsContent({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string }>;
}) {
  await connection();
  const user = await getSessionUser();
  if (!user) {
    redirect("/acceso?redirect=/serbio/flashcards");
  }

  const { unit } = await searchParams;
  const unitId = unit ? parseInt(unit, 10) : undefined;

  const units = await getAllUnits("starter");

  let entries;
  if (unitId && !isNaN(unitId)) {
    entries = await getEntriesByUnit(unitId);
  } else {
    const allEntries = await Promise.all(
      units.map((u) => getEntriesByUnit(u.id)),
    );
    entries = allEntries.flat();
  }

  const audioUrls: Record<number, string> = {};
  for (const entry of entries) {
    if (entry.audio_file) {
      audioUrls[entry.id] = getEntryAudioUrl(entry.audio_file);
    }
  }

  const selectedLabel = unitId
    ? units.find((u) => u.id === unitId)?.label ?? `Unidad ${unitId}`
    : "Todas las unidades";

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 md:px-8 md:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-black md:text-4xl">
            Repaso
          </h1>
          <p className="text-sm text-black/45">
            {selectedLabel} · {entries.length}{" "}
            {entries.length === 1 ? "tarjeta" : "tarjetas"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/serbio/flashcards"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            !unitId
              ? "bg-amber-100 text-amber-800"
              : "bg-white text-black/50 hover:bg-amber-50"
          }`}
        >
          Todas
        </Link>
        {units.map((u) => (
          <Link
            key={u.id}
            href={`/serbio/flashcards?unit=${u.id}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              unitId === u.id
                ? "bg-amber-100 text-amber-800"
                : "bg-white text-black/50 hover:bg-amber-50"
            }`}
          >
            {u.label}
          </Link>
        ))}
      </div>

      {entries.length > 0 ? (
        <FlashcardDeck entries={entries} audioUrls={audioUrls} />
      ) : (
        <div className="py-20 text-center">
          <p className="text-lg text-black/40">
            No hay tarjetas disponibles.
          </p>
        </div>
      )}
    </section>
  );
}
