import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";

import { getDirectusReadingSources } from "@/lib/learn/reading-directus";

export const metadata: Metadata = {
  title: "Revista",
  description:
    "Sección de lectura interactiva de revistas serbias para practicar vocabulario, traducción y audio.",
};

export default function RevistaCatalogPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RevistaCatalogContent />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
      <div className="rounded-[40px] border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-5 shadow-sm md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1px_1fr] lg:items-stretch">
          <div className="space-y-4 rounded-[30px] border border-black/5 bg-white/85 p-5">
            <div className="mx-auto h-5 w-28 animate-pulse rounded-full bg-amber-100" />
            <div className="mx-auto h-12 w-full max-w-xl animate-pulse rounded-2xl bg-amber-100" />
            <div className="mx-auto h-6 w-full max-w-2xl animate-pulse rounded-2xl bg-amber-50" />
            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-11 animate-pulse rounded-2xl bg-amber-50" />
              ))}
            </div>
          </div>
          <div className="hidden bg-gradient-to-b from-transparent via-amber-300/60 to-transparent lg:block" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-[28px] bg-amber-50" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

async function RevistaCatalogContent() {
  await connection();
  const sources = await getDirectusReadingSources("revista");
  const featured = sources[0];
  const remaining = sources.slice(1);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
      <div className="space-y-4 text-center">
        <p className="eyebrow mx-auto w-fit">Aprender serbio</p>
        <h1 className="text-4xl font-semibold tracking-[-0.05em] text-black md:text-5xl">
          Revista
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-8 text-black/60">
          Abre una revista como si fuera una publicación real: portada, páginas y texto
          dentro del papel para practicar lectura palabra por palabra.
        </p>
      </div>

      {featured ? (
        <div className="relative overflow-hidden rounded-[40px] border border-amber-200 bg-gradient-to-br from-[#f7edd7] via-[#fffaf2] to-[#eef5ff] p-4 shadow-[0_30px_80px_rgba(117,84,24,0.14)] md:p-6">
          <div className="pointer-events-none absolute inset-y-6 left-1/2 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-amber-300/70 to-transparent lg:block" />
          <div className="grid gap-4 lg:grid-cols-[1fr_1px_1fr] lg:items-stretch">
            <div className="relative overflow-hidden rounded-[30px] border border-amber-100 bg-[#fffdf6] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                Revista destacada
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-black md:text-4xl">
                {featured.title}
              </h2>
              <p className="mt-3 max-w-xl text-base leading-8 text-black/65 md:text-lg">
                {featured.subtitle}
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-black/45">
                <span className="rounded-full bg-amber-50 px-3 py-1.5 shadow-sm">{featured.topic}</span>
                <span className="rounded-full bg-amber-50 px-3 py-1.5 shadow-sm">
                  {featured.readingMinutes} min
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1.5 shadow-sm">{featured.sourceName}</span>
              </div>

              <div className="mt-8 grid gap-3 text-sm text-black/55">
                {[
                  "Lectura suave, con frases cortas y vocabulario útil.",
                  "Audio y traducción al tocar cada palabra.",
                  "Formato pensado para revista, libro y video.",
                ].map((line) => (
                  <div key={line} className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white/80 px-4 py-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={`/serbio/revista/${featured.slug}`}
                  className="inline-flex items-center justify-center rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
                >
                  Abrir portada
                </Link>
                <span className="rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black/50">
                  Lectura tipo revista abierta
                </span>
              </div>
            </div>

            <div className="hidden bg-gradient-to-b from-transparent via-amber-300/60 to-transparent lg:block" />

            <div className="grid gap-4 sm:grid-cols-2 lg:pl-2">
              {sources.map((source, index) => (
                <Link
                  key={source.slug}
                  href={`/serbio/revista/${source.slug}`}
                  className={`group relative overflow-hidden rounded-[28px] border border-black/10 bg-gradient-to-br ${source.tone} p-5 transition hover:-translate-y-0.5 hover:shadow-lg`}
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-white/60" />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/40">
                    Revista · {source.topic}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-black">
                    {source.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-black/60">{source.subtitle}</p>

                  <div className="mt-4 flex items-center justify-between text-sm text-black/45">
                    <span>{source.sourceName}</span>
                    <span>{source.readingMinutes} min</span>
                  </div>

                  <div className="mt-4 space-y-2 rounded-2xl border border-white/70 bg-white/55 p-4 backdrop-blur-sm">
                    <div className="h-2 w-11/12 rounded-full bg-black/7" />
                    <div className="h-2 w-full rounded-full bg-black/7" />
                    <div className="h-2 w-10/12 rounded-full bg-black/7" />
                    <div className="h-2 w-9/12 rounded-full bg-black/7" />
                  </div>

                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-sm font-semibold text-amber-800 transition group-hover:bg-white">
                    {index === 0 ? "Leer ahora" : "Abrir revista"} <span className="text-lg">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 text-center sm:grid-cols-3">
        <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800">
          Revistas: {sources.length}
        </span>
        <span className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black/45">
          Libros: 0 · Próximamente
        </span>
        <span className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black/45">
          Videos: 0 · Próximamente
        </span>
      </div>

      {remaining.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {remaining.map((source) => (
            <Link
              key={source.slug}
              href={`/serbio/revista/${source.slug}`}
              className={`group relative overflow-hidden rounded-[28px] border border-black/10 bg-gradient-to-br ${source.tone} p-5 transition hover:-translate-y-0.5 hover:shadow-lg`}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-white/60" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/40">
                Revista · {source.topic}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-black">
                {source.title}
              </h2>
              <p className="mt-2 text-sm leading-7 text-black/60">{source.subtitle}</p>

              <div className="mt-4 flex items-center justify-between text-sm text-black/45">
                <span>{source.sourceName}</span>
                <span>{source.readingMinutes} min</span>
              </div>

              <div className="mt-4 space-y-2 rounded-2xl border border-white/70 bg-white/55 p-4 backdrop-blur-sm">
                <div className="h-2 w-11/12 rounded-full bg-black/7" />
                <div className="h-2 w-full rounded-full bg-black/7" />
                <div className="h-2 w-10/12 rounded-full bg-black/7" />
                <div className="h-2 w-9/12 rounded-full bg-black/7" />
              </div>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-sm font-semibold text-amber-800 transition group-hover:bg-white">
                Abrir revista <span className="text-lg">→</span>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
