import Image from "next/image";
import Link from "next/link";

import {
  getFeaturedMedia,
  getPrimaryAuthor,
  type WpAuthor,
  type WpCategory,
  type WpPage,
  type WpPost,
} from "@/lib/wordpress";
import { formatDate, stripHtml } from "@/lib/utils";

function MediaFrame({
  src,
  alt,
  className,
  imageClassName,
  fit = "cover",
  sizes,
}: {
  src?: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  fit?: "contain" | "cover";
  sizes?: string;
}) {
  if (!src) {
    return (
      <div
        className={`relative overflow-hidden rounded-[28px] border border-black/10 bg-[linear-gradient(135deg,rgba(209,91,31,0.22),rgba(17,17,17,0.06),rgba(13,148,136,0.2))] ${className ?? ""}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.7),transparent_55%)]" />
      </div>
    );
  }

  const imageSizes = sizes ?? "(max-width: 768px) 100vw, 50vw";

  return (
    <div className={`relative overflow-hidden rounded-[28px] bg-black/5 ${className ?? ""}`}>
      {fit === "contain" ? (
        <Image
          src={src}
          alt=""
          aria-hidden="true"
          fill
          className="scale-110 object-cover object-center opacity-25 blur-md"
          sizes={imageSizes}
        />
      ) : null}
      <Image
        src={src}
        alt={alt}
        fill
        loading="eager"
        className={`${fit === "cover" ? "object-cover" : "object-contain p-1"} object-center transition duration-700 ${imageClassName ?? ""}`}
        sizes={imageSizes}
      />
    </div>
  );
}

function MetaLine({
  eyebrow,
  date,
  author,
  className,
}: {
  eyebrow?: string;
  date: string;
  author?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] ${className ?? "text-black/45"}`}
    >
      {eyebrow ? <span className="text-[var(--color-accent)]">{eyebrow}</span> : null}
      <span>{formatDate(date)}</span>
      {author ? <span>{author}</span> : null}
    </div>
  );
}

function getPreviewText(value: string, limit: number): string {
  const text = stripHtml(value);

  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit).trimEnd()}...`;
}

export function FeaturedPostCard({
  post,
  eyebrow,
}: {
  post: WpPost;
  eyebrow?: string;
}) {
  const media = getFeaturedMedia(post);
  const author = getPrimaryAuthor(post);
  const title = stripHtml(post.title.rendered);

  return (
    <article className="story-card group grid gap-6 p-5 md:grid-cols-[1.15fr_.85fr] md:p-6">
      <div className="space-y-5">
        <MetaLine eyebrow={eyebrow} date={post.date} author={author?.name} />
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-black md:text-4xl">
            <Link href={`/entradas/${post.slug}`} className="underline-offset-4 hover:underline">
              {title}
            </Link>
          </h2>
          <div
            className="max-w-2xl text-base leading-7 text-black/65"
            dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
          />
        </div>
        <Link href={`/entradas/${post.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)]">
          Leer historia
          <span aria-hidden="true">+</span>
        </Link>
      </div>
      <MediaFrame
        src={media?.source_url}
        alt={media?.alt_text || title}
        className="min-h-[280px] border border-black/10"
        fit="cover"
      />
    </article>
  );
}

export function MagazineLeadPostCard({
  post,
  categoryLabel,
}: {
  post: WpPost;
  categoryLabel?: string;
}) {
  const media = getFeaturedMedia(post);
  const title = stripHtml(post.title.rendered);
  const excerpt = getPreviewText(post.excerpt.rendered, 180);

  return (
    <article className="story-card group flex h-full min-h-0 flex-col overflow-hidden rounded-[36px]">
      <div className="min-h-[270px] flex-1 md:min-h-[340px]">
        <MediaFrame
          src={media?.source_url}
          alt={media?.alt_text || title}
          className="h-full min-h-0 rounded-none"
          fit="cover"
          imageClassName="group-hover:scale-[1.02]"
          sizes="(max-width: 1024px) 100vw, 66vw"
        />
      </div>

      <div className="space-y-4 p-5 md:p-6">
        {categoryLabel ? (
          <div className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[var(--color-accent)]">
            {categoryLabel}
          </div>
        ) : null}
        <h2 className="line-clamp-3 text-2xl font-semibold leading-[0.98] tracking-[-0.05em] text-black md:text-[2.35rem]">
          <Link href={`/entradas/${post.slug}`} className="underline-offset-4 hover:underline">
            {title}
          </Link>
        </h2>
        {excerpt ? (
          <p className="line-clamp-2 max-w-2xl text-sm leading-6 text-black/62 md:text-base md:leading-7">
            {excerpt}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function MagazineStackedPostCard({
  post,
  categoryLabel,
}: {
  post: WpPost;
  categoryLabel?: string;
}) {
  const media = getFeaturedMedia(post);
  const title = stripHtml(post.title.rendered);

  return (
    <article className="story-card group flex h-full min-h-0 flex-col overflow-hidden rounded-[32px]">
      <div className="min-h-[145px] flex-1 md:min-h-[160px]">
        <MediaFrame
          src={media?.source_url}
          alt={media?.alt_text || title}
          className="h-full min-h-0 rounded-none"
          fit="cover"
          imageClassName=""
          sizes="(max-width: 1024px) 100vw, 28vw"
        />
      </div>

      <div className="space-y-2.5 p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {categoryLabel ? (
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              {categoryLabel}
            </span>
          ) : null}
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-black/42">
            {formatDate(post.date)}
          </span>
        </div>
        <h3 className="line-clamp-4 max-w-xl text-base font-semibold leading-snug tracking-[-0.03em] text-black md:text-lg">
          <Link href={`/entradas/${post.slug}`} className="underline-offset-4 hover:underline">
            {title}
          </Link>
        </h3>
      </div>
    </article>
  );
}

export function MagazinePlaceholder({
  variant,
  slot,
}: {
  variant: "lead" | "stacked";
  slot: number;
}) {
  const minHeight =
    variant === "lead"
      ? "aspect-[5/4] min-h-[420px] md:min-h-[500px] lg:h-full lg:min-h-0 lg:aspect-auto"
      : "aspect-[16/10] min-h-[220px] md:min-h-[250px] lg:h-full lg:min-h-0 lg:aspect-auto";

  return (
    <div
      className={`reserved-slot relative overflow-hidden rounded-[32px] ${minHeight}`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(209,91,31,0.12),transparent_38%,rgba(15,118,110,0.1)_100%)]" />
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[32px]">
        <div className="min-h-[160px] flex-1 bg-white/15" />
        <div className="space-y-3 bg-white/92 p-4 md:p-5">
          <div className="eyebrow w-fit bg-white">Espacio reservado</div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/34">
            Slot portada #{slot}
          </p>
          <p className="max-w-sm text-sm leading-6 text-black/46">
            La estructura se mantiene fija mientras publicas más noticias.
          </p>
        </div>
      </div>
    </div>
  );
}

export function PostCard({
  post,
  eyebrow,
}: {
  post: WpPost;
  eyebrow?: string;
}) {
  const media = getFeaturedMedia(post);
  const author = getPrimaryAuthor(post);
  const title = stripHtml(post.title.rendered);

  return (
    <article className="story-card group flex h-full flex-col gap-4 p-4">
      <MediaFrame
        src={media?.source_url}
        alt={media?.alt_text || title}
        className="min-h-[220px] border border-black/10"
        fit="cover"
      />
      <div className="flex flex-1 flex-col gap-4">
        <MetaLine eyebrow={eyebrow} date={post.date} author={author?.name} />
        <div className="space-y-3">
          <h3 className="text-xl font-semibold tracking-[-0.03em] text-black">
            <Link href={`/entradas/${post.slug}`} className="underline-offset-4 hover:underline">
              {title}
            </Link>
          </h3>
          <div
            className="text-sm leading-6 text-black/60"
            dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
          />
        </div>
        <div className="mt-auto pt-2">
          <Link href={`/entradas/${post.slug}`} className="text-sm font-semibold text-[var(--color-accent)]">
            Abrir entrada
          </Link>
        </div>
      </div>
    </article>
  );
}

export function CompactPostCard({
  post,
  eyebrow,
}: {
  post: WpPost;
  eyebrow?: string;
}) {
  const media = getFeaturedMedia(post);
  const author = getPrimaryAuthor(post);
  const title = stripHtml(post.title.rendered);

  return (
    <article className="story-card group flex h-full flex-col gap-4 p-4">
      <MediaFrame
        src={media?.source_url}
        alt={media?.alt_text || title}
        className="aspect-[16/10] min-h-[180px] border border-black/10 bg-white/70"
        fit="cover"
        sizes="(max-width: 768px) 100vw, 520px"
      />
      <div className="flex min-w-0 flex-col gap-3">
        <MetaLine eyebrow={eyebrow} date={post.date} author={author?.name} />
        <h3 className="text-xl font-semibold tracking-[-0.03em] text-black">
          <Link href={`/entradas/${post.slug}`} className="underline-offset-4 hover:underline">
            {title}
          </Link>
        </h3>
        <div
          className="text-sm leading-6 text-black/60"
          dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
        />
      </div>
    </article>
  );
}

export function HeadlinePostCard({
  post,
  eyebrow,
  className,
  showThumbnail = false,
}: {
  post: WpPost;
  eyebrow?: string;
  className?: string;
  showThumbnail?: boolean;
}) {
  const media = getFeaturedMedia(post);
  const title = stripHtml(post.title.rendered);

  return (
    <article className={`${showThumbnail ? "grid grid-cols-[96px_minmax(0,1fr)] gap-3" : "space-y-3"} ${className ?? ""}`}>
      {showThumbnail ? (
        <Link href={`/entradas/${post.slug}`} className="block" aria-label={title}>
          <MediaFrame
            src={media?.source_url}
            alt={media?.alt_text || title}
            className="h-24 rounded-2xl border border-black/10 bg-white/70"
            fit="cover"
            sizes="96px"
          />
        </Link>
      ) : null}

      <div className="min-w-0 space-y-2.5">
        <MetaLine eyebrow={eyebrow} date={post.date} />
        <h3 className="text-lg font-semibold leading-7 tracking-[-0.03em] text-black">
          <Link href={`/entradas/${post.slug}`} className="underline-offset-4 hover:underline">
            {title}
          </Link>
        </h3>
      </div>
    </article>
  );
}

export function CategoryCard({ category }: { category: WpCategory }) {
  return (
    <article className="panel flex h-full flex-col gap-4 p-5">
      <div className="eyebrow w-fit">{category.count} publicaciones</div>
      <div className="space-y-3">
        <h3 className="text-2xl font-semibold tracking-[-0.04em] text-black">
          <Link href={`/categorias/${category.slug}`} className="underline-offset-4 hover:underline">
            {category.name}
          </Link>
        </h3>
        <p className="text-sm leading-6 text-black/60">
          {category.description?.trim() ||
            `Archivo dinámico conectado a WordPress para la categoría ${category.name}.`}
        </p>
      </div>
      <div className="mt-auto pt-2">
        <Link href={`/categorias/${category.slug}`} className="text-sm font-semibold text-[var(--color-accent)]">
          Ver archivo
        </Link>
      </div>
    </article>
  );
}

export function AuthorCard({ author }: { author: WpAuthor }) {
  const avatar = author.avatar_urls?.["96"] ?? author.avatar_urls?.["48"];

  return (
    <article className="panel flex h-full items-center gap-4 p-4">
      <div className="relative h-14 w-14 overflow-hidden rounded-full border border-black/10 bg-black/5">
        {avatar ? (
          <Image
            src={avatar}
            alt={author.name}
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : null}
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-black">{author.name}</p>
        <p className="text-sm text-black/55">
          {author.description?.trim() || "Perfil de autor recuperado desde WordPress."}
        </p>
      </div>
    </article>
  );
}

export function PageCard({ page }: { page: WpPage }) {
  return (
    <article className="panel flex h-full flex-col gap-4 p-5">
      <div className="eyebrow w-fit">Página fija</div>
      <h3 className="text-xl font-semibold tracking-[-0.03em] text-black">
        <Link href={`/paginas/${page.slug}`} className="underline-offset-4 hover:underline">
          {stripHtml(page.title.rendered)}
        </Link>
      </h3>
      <div
        className="text-sm leading-6 text-black/60"
        dangerouslySetInnerHTML={{ __html: page.excerpt.rendered }}
      />
      <div className="mt-auto pt-2">
        <Link href={`/paginas/${page.slug}`} className="text-sm font-semibold text-[var(--color-accent)]">
          Abrir página
        </Link>
      </div>
    </article>
  );
}

export function EmptyCollection({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className="panel flex min-h-[220px] flex-col justify-between gap-4 p-6">
      <div className="space-y-3">
        <div className="eyebrow w-fit">Pendiente en WordPress</div>
        <h3 className="text-2xl font-semibold tracking-[-0.04em] text-black">{title}</h3>
        <p className="max-w-2xl text-sm leading-6 text-black/60">{description}</p>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)]"
      >
        Revisar backend
      </a>
    </div>
  );
}

export function AdPlaceholder({
  label = "Publicidad",
  title = "Espacio reservado para anuncios",
  description = "Sustituye este bloque por el banner, script o creativo final cuando lo tengas listo.",
  format = "rectangle",
}: {
  label?: string;
  title?: string;
  description?: string;
  format?: "leaderboard" | "rectangle" | "vertical";
}) {
  const formatClass =
    format === "leaderboard"
      ? "min-h-[160px] md:min-h-[220px]"
      : format === "vertical"
        ? "min-h-[320px]"
        : "min-h-[250px]";

  return (
    <aside className={`ad-slot ${formatClass}`}>
      <div className="eyebrow w-fit bg-white/55">{label}</div>
      <div className="space-y-3">
        <p className="text-2xl font-semibold tracking-[-0.04em] text-black">{title}</p>
        <p className="max-w-xl text-sm leading-6 text-black/55">{description}</p>
      </div>
      <div className="inline-flex w-fit items-center rounded-full border border-black/10 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-black/50">
        {format === "leaderboard"
          ? "970 x 250"
          : format === "vertical"
            ? "300 x 600"
            : "336 x 280"}
      </div>
    </aside>
  );
}

export function ReservedCategorySlot({
  order,
}: {
  order: number;
}) {
  return (
    <div className="reserved-slot min-h-[520px]">
      <div className="eyebrow w-fit bg-white/55">Espacio reservado</div>
      <div className="mt-auto text-xs font-semibold uppercase tracking-[0.24em] text-black/28">
        Categoría #{order}
      </div>
    </div>
  );
}
