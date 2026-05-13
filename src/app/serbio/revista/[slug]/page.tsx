import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import { estimateReadingMinutes } from "@/lib/learn/reading-library";
import {
  getDirectusReadingSourceBySlug,
  getDirectusReadingSources,
} from "@/lib/learn/reading-directus";
import { ReadingReader } from "@/components/learn/reading-reader";

export const metadata: Metadata = {
  title: "Revista · Lectura",
  description:
    "Lee una revista interactiva en serbio con traducción, colores por vocabulario y audio.",
};

export default function RevistaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RevistaDetailContent params={params} />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8 md:py-12">
      <div className="h-10 w-52 animate-pulse rounded-xl bg-amber-100" />
      <div className="rounded-[40px] border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-4 shadow-sm md:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_1px_1fr] lg:items-stretch">
          <div className="h-[240px] animate-pulse rounded-[30px] bg-white/80" />
          <div className="hidden bg-gradient-to-b from-transparent via-amber-300/60 to-transparent lg:block" />
          <div className="h-[240px] animate-pulse rounded-[30px] bg-white/80" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-[520px] animate-pulse rounded-[32px] bg-amber-50" />
        <div className="h-[420px] animate-pulse rounded-[32px] bg-amber-50" />
      </div>
    </section>
  );
}

async function RevistaDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const source = await getDirectusReadingSourceBySlug("revista", slug);

  if (!source) {
    notFound();
  }

  const otherSources = (await getDirectusReadingSources("revista")).filter(
    (item) => item.slug !== source.slug,
  );
  const words = source.paragraphs.join(" ");
  const readingMinutes = estimateReadingMinutes(words);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8 md:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/serbio/revista"
            className="text-sm font-medium text-black/45 transition hover:text-black/70"
          >
            ← Revista
          </Link>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-black md:text-4xl">
            {source.title}
          </h1>
          <p className="mt-1 text-sm text-black/45">
            {source.sourceName} · {source.topic} · {readingMinutes} min de lectura
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-sm font-medium text-black/55">
          <span className="rounded-full border border-black/10 bg-white px-3 py-1.5">
            Revista
          </span>
          <span className="rounded-full border border-black/10 bg-white px-3 py-1.5">
            Audio serbio
          </span>
          <span className="rounded-full border border-black/10 bg-white px-3 py-1.5">
            Traducción al español
          </span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[40px] border border-amber-200 bg-gradient-to-br from-[#f7edd7] via-[#fffaf2] to-[#eef5ff] p-4 shadow-[0_30px_80px_rgba(117,84,24,0.14)] md:p-6">
        <div className="pointer-events-none absolute inset-y-6 left-1/2 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-amber-300/70 to-transparent lg:block" />
        <div className="grid gap-4 lg:grid-cols-[1fr_1px_1fr] lg:items-stretch">
          <div className="relative overflow-hidden rounded-[30px] border border-amber-100 bg-[#fffdf6] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Portada de lectura
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-black md:text-4xl">
              {source.title}
            </h2>
            <p className="mt-3 max-w-xl text-base leading-8 text-black/65 md:text-lg">
              {source.subtitle}
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-black/45">
              <span className="rounded-full bg-amber-50 px-3 py-1.5 shadow-sm">{source.topic}</span>
              <span className="rounded-full bg-amber-50 px-3 py-1.5 shadow-sm">
                {source.readingMinutes} min
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1.5 shadow-sm">{source.sourceName}</span>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-black/55">
              {[
                "Toca las palabras para oír el audio del servidor.",
                "La traducción aparece arriba de la palabra seleccionada.",
                "En móvil, el ejemplo se abre como modal para leer mejor.",
              ].map((line) => (
                <div key={line} className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white/80 px-4 py-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden bg-gradient-to-b from-transparent via-amber-300/60 to-transparent lg:block" />

          <div className="relative overflow-hidden rounded-[30px] border border-amber-100 bg-[#fffdf6] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Resumen de página
            </p>
            <div className="mt-4 grid gap-3">
              <div className="h-3 w-11/12 rounded-full bg-black/7" />
              <div className="h-3 w-full rounded-full bg-black/7" />
              <div className="h-3 w-10/12 rounded-full bg-black/7" />
              <div className="h-3 w-9/12 rounded-full bg-black/7" />
              <div className="h-3 w-11/12 rounded-full bg-black/7" />
              <div className="h-3 w-8/12 rounded-full bg-black/7" />
            </div>

            <div className="mt-8 rounded-[24px] border border-black/5 bg-white/80 p-4">
              <p className="text-sm font-medium text-black/65">La lectura está preparada para sentirse como una revista abierta, con el texto dentro del papel y el lector al centro.</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-black/45">
              <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">Revista</span>
              <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">Lectura palabra por palabra</span>
              <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">Audio + traducción</span>
            </div>
          </div>
        </div>
      </div>

      <ReadingReader source={source} />

      {otherSources.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-black">Otras revistas</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {otherSources.map((item) => (
              <Link
                key={item.slug}
                href={`/serbio/revista/${item.slug}`}
                className={`rounded-[24px] border border-black/10 bg-gradient-to-br ${item.tone} p-4 transition hover:-translate-y-0.5 hover:shadow-md`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/40">
                  Revista · {item.topic}
                </p>
                <p className="mt-1 text-lg font-semibold text-black">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-black/55">{item.subtitle}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
