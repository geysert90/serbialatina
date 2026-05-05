import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import {
  JOBS_SOURCE_CACHE_VERSION,
  getJoobleCityLabel,
  getJoobleDefaults,
  normalizeJoobleLocation,
  searchSerbiaJobs,
  SERBIAN_JOB_CITIES,
  type JoobleJob,
} from "@/lib/jooble";
import { stripHtml, toAbsoluteUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Trabajos",
  description:
    "Ofertas laborales para la comunidad Serbia Latina, alimentadas por Jooble e Infostud RSS.",
  alternates: {
    canonical: toAbsoluteUrl("/trabajos"),
  },
  openGraph: {
    title: "Trabajos en Serbia Latina",
    description:
      "Explora oportunidades laborales conectadas a Jooble e Infostud desde Serbia Latina.",
    url: toAbsoluteUrl("/trabajos"),
  },
};

type JobsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function cleanSearchValue(value: string | undefined, fallback: string): string {
  return value?.replace(/\s+/g, " ").trim() || fallback;
}

function parsePage(value: string | undefined): number {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isNaN(page) || page < 1 ? 1 : page;
}

function buildJobsHref({
  keywords,
  location,
  page,
}: {
  keywords: string;
  location: string;
  page: number;
}): string {
  const params = new URLSearchParams({
    location,
    page: String(page),
  });

  if (keywords) {
    params.set("keywords", keywords);
  }

  return `/trabajos?${params.toString()}`;
}

function CompanyLogo({ job }: { job: JoobleJob }) {
  if (!job.companyLogoUrl) {
    return null;
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-black/8 bg-white/75">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={job.companyLogoUrl} alt={job.company || job.title} className="h-full w-full object-contain p-2" />
    </div>
  );
}

function JobCard({ job }: { job: JoobleJob }) {
  const description = stripHtml(job.snippet);
  const updated = job.updated ? new Date(job.updated) : null;
  const updatedLabel =
    updated && !Number.isNaN(updated.getTime())
      ? new Intl.DateTimeFormat("es-ES", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(updated)
      : null;

  return (
    <article className="story-card group flex h-full flex-col gap-5 p-5 md:p-6">
      <div className="flex items-start gap-4">
        <CompanyLogo job={job} />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {job.type ? <span className="eyebrow w-fit">{job.type}</span> : null}
            {job.source ? (
              <span className="rounded-full border border-black/8 bg-white/65 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-black/42">
                {job.source}
              </span>
            ) : null}
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-semibold leading-tight tracking-[-0.04em] text-black">
              <a href={job.link} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                {job.title}
              </a>
            </h2>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-black/55">
              {job.company ? <span>{job.company}</span> : null}
              <span>{job.location}</span>
              {updatedLabel ? <span>Actualizado: {updatedLabel}</span> : null}
            </div>
          </div>
        </div>
      </div>

      {description ? (
        <p className="line-clamp-4 text-sm leading-7 text-black/62">{description}</p>
      ) : null}

      <div className="mt-auto flex flex-col gap-4 border-t border-black/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-semibold text-black/65">
          {job.salary ? job.salary : "Salario no especificado"}
        </div>
        <a
          href={job.link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--color-accent)]"
        >
          Ver oferta
          <span aria-hidden="true" className="ml-2">↗</span>
        </a>
      </div>
    </article>
  );
}

async function JobsResults({ searchParams }: JobsPageProps) {
  await connection();

  const params = await searchParams;
  const defaults = getJoobleDefaults();
  const keywords = cleanSearchValue(firstParam(params.keywords), defaults.keywords);
  const location = normalizeJoobleLocation(firstParam(params.location) ?? defaults.location);
  const locationLabel = getJoobleCityLabel(location);
  const page = parsePage(firstParam(params.page));
  const result = await searchSerbiaJobs({
    keywords,
    location,
    page,
    resultOnPage: 50,
    cacheVersion: JOBS_SOURCE_CACHE_VERSION,
  });
  const totalPages = Math.max(1, Math.ceil(result.totalCount / result.perPage));
  const canGoBack = result.page > 1;
  const canGoNext = result.jobs.length === result.perPage && result.page < totalPages;

  return (
    <>
      <div className="panel overflow-hidden p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-end">
          <div className="space-y-5">
            <div className="eyebrow w-fit">Jooble + Infostud RSS</div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-[-0.06em] text-black md:text-6xl">
                Trabajos para la comunidad Serbia Latina
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-black/65">
                Ofertas laborales consultadas en Jooble e Infostud. Por defecto se muestran las publicaciones
                más recientes, sin forzar palabra clave. Al cambiar la ciudad, Jooble consulta esa ubicación e
                Infostud RSS solo aporta anuncios cuyo texto menciona esa ciudad.
              </p>
            </div>
          </div>

          <form action="/trabajos" className="rounded-[30px] border border-black/8 bg-white/65 p-4 shadow-[0_24px_70px_-48px_rgba(0,0,0,0.55)]">
            <div className="grid gap-3">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-black/42">
                  Palabras clave
                </span>
                <input
                  name="keywords"
                  defaultValue={keywords}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-[var(--color-accent)]"
                  placeholder="Opcional: english, developer, sales..."
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-black/42">
                  Ubicación
                </span>
                <select
                  name="location"
                  defaultValue={location}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-[var(--color-accent)]"
                >
                  {SERBIAN_JOB_CITIES.map((city) => (
                    <option key={city.value} value={city.value}>
                      {city.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
              >
                Buscar trabajos
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/42">
            {result.configured ? `${result.totalCount} resultados encontrados` : "Integración pendiente"}
          </p>
          <p className="mt-1 text-sm text-black/55">
            {keywords ? (
              <>
                Búsqueda: <strong>{keywords}</strong> en <strong>{locationLabel}</strong>
              </>
            ) : (
              <>
                Últimas ofertas en <strong>{locationLabel}</strong> desde Jooble e Infostud RSS
              </>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          {canGoBack ? (
            <Link
              href={buildJobsHref({ keywords, location, page: result.page - 1 })}
              className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-semibold text-black hover:bg-white"
            >
              Anterior
            </Link>
          ) : null}
          {canGoNext ? (
            <Link
              href={buildJobsHref({ keywords, location, page: result.page + 1 })}
              className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-semibold text-black hover:bg-white"
            >
              Siguiente
            </Link>
          ) : null}
        </div>
      </div>

      {result.error ? (
        <div className="rounded-[28px] border border-[rgba(209,91,31,0.24)] bg-[rgba(209,91,31,0.08)] p-5 text-sm leading-7 text-black/68">
          {result.error}
        </div>
      ) : null}

      {result.jobs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : result.error ? null : (
        <div className="reserved-slot min-h-[280px]">
          <div className="eyebrow w-fit bg-white/55">Sin resultados</div>
          <p className="mt-auto max-w-2xl text-sm leading-7 text-black/55">
            No encontramos ofertas para esta búsqueda en Jooble ni en Infostud RSS. Prueba con otras
            palabras clave o selecciona otra ciudad de Serbia.
          </p>
        </div>
      )}
    </>
  );
}

function JobsFallback() {
  return (
    <div className="panel min-h-[360px] p-6 md:p-8">
      <div className="eyebrow w-fit">Jooble + Infostud RSS</div>
      <div className="mt-5 h-8 w-2/3 rounded-full bg-black/5" />
      <div className="mt-4 h-4 w-1/2 rounded-full bg-black/5" />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((slot) => (
          <div key={slot} className="min-h-[180px] rounded-[28px] border border-black/8 bg-white/45" />
        ))}
      </div>
    </div>
  );
}

export default function JobsPage({ searchParams }: JobsPageProps) {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
      <Suspense fallback={<JobsFallback />}>
        <JobsResults searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
