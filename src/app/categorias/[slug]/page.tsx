import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EmptyCollection, PostCard } from "@/components/content-cards";
import {
  getAllCategorySlugs,
  getCategoryBySlug,
  getPostsByCategoryId,
} from "@/lib/wordpress";
import { toAbsoluteUrl } from "@/lib/utils";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};


export async function generateStaticParams() {
  const slugs = await getAllCategorySlugs();
  // Limitar el prerender a los primeros 20 (resto on-demand) para evitar
  // USE_CACHE_TIMEOUT con el WP-API lento en builds
  return slugs.slice(0, 20).map((slug) => ({ slug }));
}


export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Categoría no encontrada",
    };
  }

  const description =
    category.description?.trim() ||
    `Archivo dinámico de la categoría ${category.name} en Serbia Latina.`;

  return {
    title: category.name,
    description,
    alternates: {
      canonical: toAbsoluteUrl(`/categorias/${category.slug}`),
    },
    openGraph: {
      title: category.name,
      description,
      url: toAbsoluteUrl(`/categorias/${category.slug}`),
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const posts = await getPostsByCategoryId(category.id, 12);

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
      {posts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} eyebrow={category.name} />
          ))}
        </div>
      ) : (
        <EmptyCollection
          title={`La categoría ${category.name} no tiene entradas todavía`}
          description="Esta sección se llenará automáticamente cuando publiques contenido."
          href="https://admin.serbialatina.com"
        />
      )}
    </section>
  );
}
