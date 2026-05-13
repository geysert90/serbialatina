import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CommentsSection } from "@/components/comments-section";
import { FeaturedPostCard, PostCard } from "@/components/content-cards";
import { RichContent } from "@/components/rich-content";
import {
  areCommentsOpen,
  getAllCategories,
  getAllPostSlugs,
  getFeaturedMedia,
  getPostBySlug,
  getPrimaryAuthor,
  getPrimaryCategory,
  getRelatedPosts,
} from "@/lib/wordpress";
import { formatDate, stripHtml, toAbsoluteUrl } from "@/lib/utils";

type PostPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    comentario?: string;
    mensaje?: string;
  }>;
};

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Entrada no encontrada",
    };
  }

  const title = stripHtml(post.title.rendered);
  const description =
    stripHtml(post.excerpt.rendered) ||
    "Entrada dinámica servida desde WordPress en Serbia Latina.";
  const media = getFeaturedMedia(post);
  const imageUrl = media?.source_url;

  return {
    title,
    description,
    alternates: {
      canonical: toAbsoluteUrl(`/entradas/${post.slug}`),
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: toAbsoluteUrl(`/entradas/${post.slug}`),
      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: media.alt_text || title,
            },
          ]
        : undefined,
    },
  };
}

function CommentsFallback() {
  return (
    <section className="panel space-y-4 p-6 md:p-8" id="comentarios">
      <div className="eyebrow w-fit">Comentarios</div>
      <div className="h-8 w-64 rounded-full bg-white/60" />
      <div className="h-28 rounded-[28px] bg-white/52" />
    </section>
  );
}

export default async function PostPage({ params, searchParams }: PostPageProps) {
  const { slug } = await params;
  const [post, categories] = await Promise.all([
    getPostBySlug(slug),
    getAllCategories(),
  ]);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post.categories, post.id, 3);
  const author = getPrimaryAuthor(post);
  const category = getPrimaryCategory(post, categories);
  const media = getFeaturedMedia(post);
  const title = stripHtml(post.title.rendered);
  const mediaAlt = media?.alt_text || title;
  const mediaCaption = media ? `Imagen destacada de ${title}` : null;
  const mediaWidth = media?.media_details?.width ?? 1600;
  const mediaHeight = media?.media_details?.height ?? 900;
  const commentsOpen = areCommentsOpen(post);

  return (
    <article className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
      <div className="panel overflow-hidden">
        {media ? (
          <figure className="relative border-b border-black/10 bg-black/5">
            <div className="relative w-full overflow-hidden bg-black/5">
              <Image
                src={media.source_url}
                alt={mediaAlt}
                width={mediaWidth}
                height={mediaHeight}
                priority
                className="h-auto w-full object-contain object-center"
                sizes="(max-width: 768px) 100vw, 1024px"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/35 to-transparent" />
              {category ? (
                <div className="absolute left-4 top-4 rounded-full border border-white/35 bg-white/88 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-black/70 shadow-lg backdrop-blur md:left-6 md:top-6">
                  {category.name}
                </div>
              ) : null}
            </div>
            {mediaCaption ? (
              <figcaption className="sr-only">{mediaCaption}</figcaption>
            ) : null}
          </figure>
        ) : null}

        <div className="space-y-6 p-6 md:p-8">
          <div className="flex flex-wrap gap-3 text-sm text-black/55">
            <Link href="/" className="font-medium hover:text-black">
              Inicio
            </Link>
            {category ? (
              <Link
                href={`/categorias/${category.slug}`}
                className="font-medium hover:text-black"
              >
                {category.name}
              </Link>
            ) : null}
            <span>{formatDate(post.date)}</span>
            {author ? <span>{author.name}</span> : null}
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-black md:text-6xl">
              {title}
            </h1>
            <div
              className="max-w-3xl text-lg leading-8 text-black/65"
              dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
            />
          </div>
        </div>
      </div>

      <div className="panel p-6 md:p-8">
        <RichContent html={post.content.rendered} featuredImageSrc={media?.source_url} />
      </div>

      <Suspense fallback={<CommentsFallback />}>
        <CommentsSection
          commentsOpen={commentsOpen}
          postId={post.id}
          postSlug={post.slug}
          searchParams={searchParams}
        />
      </Suspense>

      {relatedPosts.length > 0 ? (
        <section className="space-y-5">
          <div className="space-y-3">
            <div className="eyebrow w-fit">Relacionado</div>
            <h2 className="section-title font-semibold text-black">
              Más contenido de la misma línea
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {relatedPosts.map((item, index) =>
              index === 0 ? (
                <FeaturedPostCard key={item.id} post={item} eyebrow="Siguiente lectura" />
              ) : (
                <PostCard key={item.id} post={item} eyebrow="Relacionado" />
              ),
            )}
          </div>
        </section>
      ) : null}
    </article>
  );
}
