import Link from "next/link";
import Image from "next/image";

import { getPrimaryCategory, getFeaturedMedia, type WpCategory, type WpPost } from "@/lib/wordpress";
import { formatDate, stripHtml } from "@/lib/utils";

function FeaturedCard({
  post,
  eyebrow,
}: {
  post: WpPost;
  eyebrow?: string;
}) {
  const media = getFeaturedMedia(post);
  const title = stripHtml(post.title.rendered);
  const excerpt = stripHtml(post.excerpt.rendered).slice(0, 110);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] backdrop-blur transition hover:border-white/[0.14] hover:bg-white/[0.09]">
      {media?.source_url ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src={media.source_url}
            alt={media.alt_text || title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-2.5 p-4 md:p-5">
        {eyebrow ? (
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-amber-400/80">
            {eyebrow}
          </p>
        ) : null}

        <h3 className="text-base font-semibold leading-snug tracking-[-0.02em] text-white md:text-lg">
          <Link href={`/entradas/${post.slug}`} className="hover:underline underline-offset-4">
            {title}
          </Link>
        </h3>

        {excerpt ? (
          <p className="line-clamp-2 text-sm leading-6 text-white/50">
            {excerpt}
          </p>
        ) : null}

        <div className="mt-auto flex items-center gap-3 pt-1">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/30">
            {formatDate(post.date)}
          </span>
          <span className="text-[0.68rem] font-semibold text-amber-400/70 hover:underline">
            Leer →
          </span>
        </div>
      </div>
    </article>
  );
}

export function FeaturedNewsSection({
  posts,
  categories,
}: {
  posts: WpPost[];
  categories: WpCategory[];
}) {
  if (posts.length === 0) return null;

  return (
    <section className="relative -mx-4 overflow-hidden rounded-none bg-[linear-gradient(175deg,#18181b_0%,#0f0f11_40%,#09090b_100%)] px-4 py-10 md:-mx-8 md:rounded-[32px] md:px-8 md:py-14">
      {/* Subtle glow behind heading */}
      <div className="pointer-events-none absolute -top-12 left-1/2 h-[280px] w-[500px] -translate-x-1/2 rounded-full bg-amber-500/[0.04] blur-[100px]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-2 md:mb-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-amber-400/70">
              Destacado
            </span>
          </div>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white md:text-3xl">
            Noticias destacadas
          </h2>
          <p className="max-w-xl text-sm leading-6 text-white/40">
            Noticias destacadas por el equipo de Serbia Latina.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 6).map((post) => {
            const category = getPrimaryCategory(post, categories);
            return (
              <FeaturedCard
                key={post.id}
                post={post}
                eyebrow={category?.name}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
