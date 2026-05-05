import Link from "next/link";

import {
  AdPlaceholder,
  CategoryCard,
  CompactPostCard,
  HeadlinePostCard,
  MagazineLeadPostCard,
  MagazinePlaceholder,
  MagazineStackedPostCard,
  PageCard,
  ReservedCategorySlot,
} from "@/components/content-cards";
import {
  JOBS_SOURCE_CACHE_VERSION,
  getJoobleCityLabel,
  getJoobleDefaults,
  searchSerbiaJobs,
  type JoobleJob,
} from "@/lib/jooble";
import { stripHtml } from "@/lib/utils";
import {
  getHomePageData,
  getPrimaryCategory,
  type HomeCategoryShowcase,
} from "@/lib/wordpress";

const CATEGORY_MODULE_SLOTS = 4;

function formatJobDate(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function HomeCompanyLogo({ job }: { job: JoobleJob }) {
  if (!job.companyLogoUrl) {
    return null;
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-black/8 bg-white/75">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={job.companyLogoUrl} alt={job.company || job.title} className="h-full w-full object-contain p-2" />
    </div>
  );
}

function HomeJobCard({ job }: { job: JoobleJob }) {
  const description = stripHtml(job.snippet);
  const updatedLabel = formatJobDate(job.updated);

  return (
    <article className="story-card group flex h-full min-h-[300px] snap-start flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <HomeCompanyLogo job={job} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {job.type ? <span className="eyebrow w-fit">{job.type}</span> : null}
            {job.source ? (
              <span className="rounded-full border border-black/8 bg-white/65 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-black/42">
                {job.source}
              </span>
            ) : null}
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold leading-tight tracking-[-0.04em] text-black">
              <a href={job.link} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                {job.title}
              </a>
            </h3>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-black/42">
              {job.company ? <span>{job.company}</span> : null}
              <span>{job.location}</span>
            </div>
          </div>
        </div>
      </div>

      {description ? (
        <p className="line-clamp-3 text-sm leading-6 text-black/58">{description}</p>
      ) : null}

      <div className="mt-auto flex flex-col gap-3 border-t border-black/8 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-black/62">
          <span>{job.salary || "Salario no especificado"}</span>
          {updatedLabel ? <span>{updatedLabel}</span> : null}
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

async function LatestJobsSection() {
  const defaults = getJoobleDefaults();
  const locationLabel = getJoobleCityLabel(defaults.location);
  const result = await searchSerbiaJobs({
    keywords: defaults.keywords,
    location: defaults.location,
    resultOnPage: 20,
    cacheVersion: JOBS_SOURCE_CACHE_VERSION,
  });

  return (
    <section className="panel overflow-hidden p-5 md:p-6">
      <div className="flex flex-col gap-4 border-b border-black/8 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="eyebrow w-fit">Últimos trabajos</div>
          <h2 className="section-title font-semibold text-black">Oportunidades recientes</h2>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="max-w-xl text-sm leading-6 text-black/55">
            Últimas ofertas de Jooble e Infostud RSS para <strong>{locationLabel}</strong>,
            ordenadas por fecha de publicación y con descripciones traducidas al español.
          </p>
          <Link
            href="/trabajos"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
          >
            Ver todos
          </Link>
        </div>
      </div>

      {result.error ? (
        <div className="mt-5 rounded-[28px] border border-[rgba(209,91,31,0.24)] bg-[rgba(209,91,31,0.08)] p-5 text-sm leading-7 text-black/68">
          {result.error}
        </div>
      ) : result.jobs.length > 0 ? (
        <div className="mt-6 snap-x overflow-x-auto pb-4 [scrollbar-width:thin]">
          <div className="grid grid-flow-col grid-rows-2 gap-4 [grid-auto-columns:minmax(280px,86vw)] md:[grid-auto-columns:calc((100%_-_2rem)/3)]">
            {result.jobs.map((job) => (
              <HomeJobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      ) : (
        <div className="reserved-slot mt-5 min-h-[220px]">
          <div className="eyebrow w-fit bg-white/55">Sin resultados</div>
          <p className="mt-auto max-w-2xl text-sm leading-7 text-black/55">
            Jooble e Infostud RSS no devolvieron ofertas para la búsqueda destacada. Puedes probar otros
            términos desde la página de trabajos.
          </p>
        </div>
      )}
    </section>
  );
}

function CategoryShowcaseSection({
  showcase,
  order,
}: {
  showcase?: HomeCategoryShowcase;
  order: number;
}) {
  if (!showcase) {
    return <ReservedCategorySlot order={order} />;
  }

  const [leadPost, ...recentPosts] = showcase.posts;

  return (
    <section className="panel flex h-full flex-col gap-6 p-5 md:p-6">
      <div className="flex flex-col gap-4 border-b border-black/8 pb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="eyebrow w-fit">{showcase.category.count} artículos</div>
          <Link
            href={showcase.href}
            className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]"
          >
            Ver categoría
          </Link>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-semibold tracking-[-0.05em] text-black">
            <Link href={showcase.href} className="underline-offset-4 hover:underline">
              {showcase.category.name}
            </Link>
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-black/60">
            {showcase.description}
          </p>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="space-y-4">
          {leadPost ? (
            <CompactPostCard post={leadPost} eyebrow={showcase.category.name} />
          ) : (
            <ReservedCategorySlot order={order} />
          )}
        </div>

        <div className="space-y-4 border-t border-black/8 pt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-black/42">
              Más reciente
            </p>
            <span className="text-xs uppercase tracking-[0.2em] text-black/28">
              Auto
            </span>
          </div>

          {recentPosts.length > 0 ? (
            <div className="space-y-4">
              {recentPosts.map((post, index) => (
                <HeadlinePostCard
                  key={post.id}
                  post={post}
                  eyebrow={showcase.category.name}
                  showThumbnail
                  className={index < recentPosts.length - 1 ? "border-b border-black/8 pb-4" : ""}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[220px] items-end rounded-[28px] border border-dashed border-black/12 bg-white/35 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/28">
                Esperando más entradas para completar el módulo
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  const data = await getHomePageData();
  const coverPosts = Array.from({ length: 3 }, (_, index) => data.latestPosts[index] ?? null);
  const leadCoverPost = coverPosts[0];
  const stackedCoverPosts = coverPosts.slice(1);
  const leadCoverCategory = leadCoverPost
    ? getPrimaryCategory(leadCoverPost, data.categories)?.name
    : undefined;
  const stackedCoverCategories = stackedCoverPosts.map((post) =>
    post ? getPrimaryCategory(post, data.categories)?.name : undefined,
  );
  const latestRailPosts = data.latestPosts.slice(3, 8);
  const latestRailCategories = latestRailPosts.map((post) =>
    getPrimaryCategory(post, data.categories)?.name,
  );
  const streamPosts = data.latestPosts.slice(3, 9);
  const visibleCategories = data.categories.filter(
    (category) => category.slug !== "sin-categoria",
  );
  const categorySlots = Array.from({ length: CATEGORY_MODULE_SLOTS }, (_, index) => {
    return data.categoryShowcases[index];
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 md:px-8 md:py-10">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_340px]">
        <div className="space-y-6">
          <div className="grid gap-5 lg:h-[560px] lg:grid-cols-[minmax(0,1.24fr)_minmax(280px,0.76fr)] lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)] xl:h-[620px]">
            <div className="min-w-0 lg:row-span-2 lg:h-full">
              {leadCoverPost ? (
                <MagazineLeadPostCard
                  post={leadCoverPost}
                  categoryLabel={leadCoverCategory}
                />
              ) : (
                <MagazinePlaceholder variant="lead" slot={1} />
              )}
            </div>

            {stackedCoverPosts.map((post, index) => (
              <div
                key={post?.id ?? `cover-placeholder-${index + 2}`}
                className="min-w-0 lg:h-full"
              >
                {post ? (
                  <MagazineStackedPostCard
                    post={post}
                    categoryLabel={stackedCoverCategories[index]}
                  />
                ) : (
                  <MagazinePlaceholder
                    variant="stacked"
                    slot={index + 2}
                  />
                )}
              </div>
            ))}
          </div>

          <AdPlaceholder
            format="leaderboard"
            title="Banner principal de portada"
            description="Espacio pensado para un banner horizontal superior. Cuando tengas la creatividad o el script real, se sustituye este bloque."
          />
        </div>

        <aside className="grid gap-5">
          <div className="panel p-5">
            <div className="space-y-2 border-b border-black/8 pb-4">
              <div className="eyebrow w-fit">Lo ultimo</div>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-black">
                Noticias recientes
              </h2>
            </div>

            <div className="mt-4 space-y-4">
              {latestRailPosts.length > 0 ? (
                latestRailPosts.map((post, index) => (
                  <HeadlinePostCard
                    key={post.id}
                    post={post}
                    eyebrow={latestRailCategories[index]}
                    showThumbnail
                    className={index < latestRailPosts.length - 1 ? "border-b border-black/8 pb-4" : ""}
                  />
                ))
              ) : (
                <p className="text-sm leading-6 text-black/55">
                  Esta columna se llenara con publicaciones recientes despues de las
                  tres historias de portada.
                </p>
              )}
            </div>
          </div>

          <AdPlaceholder
            format="vertical"
            title="Banner lateral"
            description="Bloque reservado para un anuncio de columna o un patrocinio fijo."
          />

          <div className="panel p-5">
            <div className="space-y-2">
              <div className="eyebrow w-fit">Explora</div>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-black">
                Categorias y paginas
              </h2>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {visibleCategories.slice(0, 8).map((category) => (
                <Link
                  key={category.id}
                  href={`/categorias/${category.slug}`}
                  className="rounded-full border border-black/8 bg-white/75 px-3 py-2 text-sm text-black/70 hover:-translate-y-0.5 hover:bg-white"
                >
                  {category.name}
                </Link>
              ))}
            </div>

            {data.pages.length > 0 ? (
              <div className="mt-5 space-y-3 border-t border-black/8 pt-5">
                {data.pages.slice(0, 2).map((page) => (
                  <PageCard key={page.id} page={page} />
                ))}
              </div>
            ) : null}
          </div>
        </aside>
      </section>

      <LatestJobsSection />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_320px]">
        <div className="panel p-5 md:p-6">
          <div className="flex flex-col gap-3 border-b border-black/8 pb-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <div className="eyebrow w-fit">Más noticias</div>
              <h2 className="section-title font-semibold text-black">Mantente informado</h2>
            </div>

            <p className="max-w-2xl text-sm leading-6 text-black/55">
              Noticias recientes para seguir la actualidad de la comunidad hispana en Serbia y los Balcanes.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {streamPosts.length > 0 ? (
              streamPosts.map((post) => (
                <CompactPostCard key={post.id} post={post} eyebrow="Más noticias" />
              ))
            ) : (
              <div className="md:col-span-2">
                <div className="reserved-slot min-h-[260px]">
                  <div className="eyebrow w-fit bg-white/55">Reservado</div>
                  <p className="mt-auto text-xs font-semibold uppercase tracking-[0.24em] text-black/28">
                    Aquí aparecerá el flujo secundario cuando publiques más contenido
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-5">
          <AdPlaceholder
            format="rectangle"
            title="Bloque patrocinado"
            description="Espacio intermedio para campañas, afiliación o autopromoción."
          />

          {data.pages[0] ? (
            <PageCard page={data.pages[0]} />
          ) : (
            <div className="reserved-slot min-h-[250px]">
              <div className="eyebrow w-fit bg-white/55">Reservado</div>
              <p className="mt-auto text-xs font-semibold uppercase tracking-[0.24em] text-black/28">
                Página destacada
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="eyebrow w-fit">Categorías destacadas</div>
            <h2 className="section-title font-semibold text-black">
              Secciones de la comunidad
            </h2>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-black/55">
            Explora noticias, eventos, trámites y recursos organizados por tema para encontrar rápido lo que necesitas.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {categorySlots.slice(0, 2).map((showcase, index) => (
            <CategoryShowcaseSection
              key={showcase?.category.id ?? `category-slot-top-${index}`}
              showcase={showcase}
              order={index + 1}
            />
          ))}
        </div>

        <AdPlaceholder
          format="leaderboard"
          title="Patrocinio intermedio"
          description="Hueco preparado para un banner panorámico entre módulos editoriales."
        />

        <div className="grid gap-6 xl:grid-cols-2">
          {categorySlots.slice(2).map((showcase, index) => (
            <CategoryShowcaseSection
              key={showcase?.category.id ?? `category-slot-bottom-${index}`}
              showcase={showcase}
              order={index + 3}
            />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <div className="eyebrow w-fit">Mapa editorial</div>
          <h2 className="section-title font-semibold text-black">Directorio de categorías</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>
    </div>
  );
}
