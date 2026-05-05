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
  return slugs.map((slug) => ({ slug }));
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
      <div className="panel space-y-5 p-6 md:p-8">
        <div className="eyebrow w-fit">{category.count} publicaciones</div>
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-[-0.05em] text-black md:text-6xl">
            {category.name}
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-black/65">
            {category.description?.trim() ||
              `Archivo automático conectado a WordPress para la categoría ${category.name}.`}
          </p>
        </div>
      </div>

      {posts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} eyebrow={category.name} />
          ))}
        </div>
      ) : (
        <EmptyCollection
          title={`La categoría ${category.name} no tiene entradas todavía`}
          description="La página ya está cableada al backend y empezará a poblarse en cuanto publiques contenido en WordPress."
          href="https://admin.segun2idioma.com"
        />
      )}
    </section>
  );
}
