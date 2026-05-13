
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { getAllUnits, getEntriesByUnit } from "@/lib/learn/directus";
import { type ReadingSource } from "@/lib/learn/reading-library";
import { getDirectusFeaturedReading } from "@/lib/learn/reading-directus";
import { getProgress, countCompleted } from "@/lib/learn/progress-store";

export const metadata: Metadata = {
  title: "Aprende Serbio",
  description:
    "Plataforma interactiva para aprender serbio desde español. Flashcards, audio nativo, lectura de revistas y seguimiento de progreso.",
};

export default function SerbioLandingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SerbioContent />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-12 md:px-8 md:py-20">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-6 w-32 animate-pulse rounded-full bg-amber-100" />
        <div className="mx-auto h-12 w-72 animate-pulse rounded-xl bg-amber-100" />
        <div className="mx-auto h-6 w-96 animate-pulse rounded-xl bg-amber-50" />
      </div>
    </section>
  );
}

async function SerbioContent() {
  await connection();
  const user = await getSessionUser();
  const featuredReading = await getDirectusFeaturedReading("revista");

  if (user) {
    const units = await getAllUnits("starter");
    const progress = getProgress(user.id);
    const unitsWithProgress = await Promise.all(
      units.map(async (unit) => {
        const completed = await countCompletedForUnit(user.id, unit.id);
        return {
          ...unit,
          completed,
          percentage: unit.count > 0 ? Math.round((completed / unit.count) * 100) : 0,
        };
      }),
    );

    const totalCompleted = progress.completedEntries.length;
    const totalEntries = units.reduce((sum, u) => sum + u.count, 0);
    const overallPct = totalEntries > 0 ? Math.round((totalCompleted / totalEntries) * 100) : 0;

    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
        <div className="space-y-3">
          <p className="eyebrow w-fit">Aprende serbio</p>
          <h1 className="text-4xl font-semibold tracking-[-0.05em] text-black md:text-5xl">
            ¡Bienvenido, {user.name.split(" ")[0]}!
          </h1>
          <p className="max-w-xl text-lg leading-8 text-black/60">
            {totalCompleted > 0
              ? `Has aprendido ${totalCompleted} de ${totalEntries} palabras y frases. ¡Sigue así!`
              : "Empieza tu viaje para aprender serbio. Cada palabra que aprendas te acerca más a Serbia."}
          </p>
        </div>

        {totalCompleted > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <StatCard value={`${progress.xp}`} label="XP" />
            <StatCard value={`${progress.streak.count} 🔥`} label="Racha" />
            <StatCard value={`${overallPct}%`} label="Completado" />
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            href="/serbio/unidades"
            className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            {totalCompleted > 0 ? "Continuar aprendiendo" : "Empieza ahora"}
            <span className="text-lg">→</span>
          </Link>
          <Link
            href="/serbio/revista"
            className="inline-flex items-center gap-2 rounded-full border border-sky-300 bg-white px-6 py-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-50"
          >
            Leer revista
          </Link>
          <Link
            href="/serbio/flashcards"
            className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-6 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-50"
          >
            Modo repaso
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: "🗣️", title: "Pronunciación nativa", desc: "Audio real con voces serbias Sophie y Nicholas." },
            { icon: "🔄", title: "Flashcards animadas", desc: "Flip 3D, selección múltiple y ejercicios de escritura." },
            { icon: "📊", title: "Tu progreso", desc: "XP, rachas diarias y logros por cada hito." },
            { icon: "📚", title: "Revista interactiva", desc: "Colores por vocabulario, traducción al tocar y audio serbio." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
              <p className="text-2xl">{item.icon}</p>
              <p className="mt-2 text-sm font-semibold text-black">{item.title}</p>
              <p className="mt-1 text-sm text-black/55">{item.desc}</p>
            </div>
          ))}
        </div>

        <RevistaPreviewCard source={featuredReading} />

        <div className="rounded-[28px] border border-sky-100 bg-sky-50/70 p-5 text-left shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Nueva sección</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-black">
                Revista para practicar lectura real
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-7 text-black/60">
                Selecciona una revista, pulsa cualquier palabra y ve su traducción,
                ejemplo de uso y audio en serbio. Más adelante podremos sumar libros
                y videos con la misma base.
              </p>
            </div>
            <Link
              href="/serbio/revista"
              className="inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Abrir revista →
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-black">Unidades</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {unitsWithProgress.map((unit) => (
              <Link
                key={unit.id}
                href={`/serbio/unidades/${unit.id}`}
                className="group rounded-2xl border border-black/10 bg-white p-4 transition hover:border-amber-300 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-black">{unit.label}</p>
                    <p className="text-sm text-black/45">
                      {unit.count} {unit.count === 1 ? "entrada" : "entradas"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {unit.percentage === 100 ? (
                      <span className="text-lg">✅</span>
                    ) : unit.percentage > 0 ? (
                      <span className="text-sm font-medium text-amber-600">
                        {unit.percentage}%
                      </span>
                    ) : null}
                    <span className="text-black/20 transition group-hover:translate-x-0.5">→</span>
                  </div>
                </div>
                {unit.percentage > 0 && unit.percentage < 100 && (
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-amber-100">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-700"
                      style={{ width: `${unit.percentage}%` }}
                    />
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-12 md:px-8 md:py-20">
      <div className="space-y-4 text-center">
        <p className="eyebrow mx-auto w-fit">Aprende serbio</p>
        <h1 className="text-4xl font-semibold tracking-[-0.05em] text-black md:text-5xl">
          Aprende serbio como un local
        </h1>
        <p className="mx-auto max-w-xl text-lg leading-8 text-black/60">
          Flashcards interactivas, audio con pronunciación nativa, lectura de revistas y
          seguimiento de tu progreso. Diseñado para hispanohablantes que viven en Serbia.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: "🗣️", title: "Pronunciación nativa", desc: "Audio real con voces serbias Sophie y Nicholas." },
          { icon: "🔄", title: "Flashcards animadas", desc: "Flip 3D, selección múltiple y ejercicios de escritura." },
          { icon: "📊", title: "Tu progreso", desc: "XP, rachas diarias y logros por cada hito." },
          { icon: "📚", title: "Revista interactiva", desc: "Colores por vocabulario, traducción al tocar y audio serbio." },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
            <p className="text-2xl">{item.icon}</p>
            <p className="mt-2 text-sm font-semibold text-black">{item.title}</p>
            <p className="mt-1 text-sm text-black/55">{item.desc}</p>
          </div>
        ))}
      </div>

      <RevistaPreviewCard source={featuredReading} />

      <div className="rounded-[28px] border border-sky-100 bg-sky-50/70 p-5 text-left shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Nueva sección</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-black">
              Revista para practicar lectura real
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-7 text-black/60">
              Selecciona una revista, pulsa cualquier palabra y ve su traducción,
              ejemplo de uso y audio en serbio. Más adelante podremos sumar libros
              y videos con la misma base.
            </p>
          </div>
          <Link
            href="/serbio/revista"
            className="inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Abrir revista →
          </Link>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/acceso?redirect=/serbio/unidades"
          className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-8 py-4 text-base font-semibold text-white transition hover:bg-amber-700"
        >
          Empieza gratis
          <span className="text-lg">→</span>
        </Link>
        <p className="mt-3 text-sm text-black/40">
          ¿Ya tienes cuenta?{" "}
          <Link href="/acceso" className="text-amber-700 underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </section>
  );
}

function RevistaPreviewCard({ source }: { source?: ReadingSource }) {
  if (!source) return null;

  return (
    <div className="rounded-[28px] border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            Revista destacada
          </p>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-black">
            {source.title}
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-black/60">{source.subtitle}</p>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-black/45">
            <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">{source.topic}</span>
            <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
              {source.readingMinutes} min
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">{source.sourceName}</span>
          </div>
        </div>
        <Link
          href={`/serbio/revista/${source.slug}`}
          className="inline-flex items-center justify-center rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          Ver revista →
        </Link>
      </div>
    </div>
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

    async function countCompletedForUnit(userId: string, unitId: number): Promise<number> {
      try {
        const entries = await getEntriesByUnit(unitId);
        return countCompleted(userId, entries.map((e) => e.id));
      } catch {
        return 0;
      }
    }
