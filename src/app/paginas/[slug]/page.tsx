import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RichContent } from "@/components/rich-content";
import { getAllPageSlugs, getPageBySlug } from "@/lib/wordpress";
import { stripHtml, toAbsoluteUrl } from "@/lib/utils";

type CmsPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getAllPageSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: CmsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) {
    return {
      title: "Página no encontrada",
    };
  }

  const title = stripHtml(page.title.rendered);
  const description =
    stripHtml(page.excerpt.rendered) ||
    `Página publicada en WordPress: ${title}.`;

  return {
    title,
    description,
    alternates: {
      canonical: toAbsoluteUrl(`/paginas/${page.slug}`),
    },
    openGraph: {
      title,
      description,
      url: toAbsoluteUrl(`/paginas/${page.slug}`),
    },
  };
}

export default async function CmsPage({ params }: CmsPageProps) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  return (
    <article className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
      <div className="panel space-y-5 p-6 md:p-8">
        <div className="eyebrow w-fit">Página fija</div>
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-[-0.05em] text-black md:text-6xl">
            {stripHtml(page.title.rendered)}
          </h1>
          <div
            className="max-w-3xl text-lg leading-8 text-black/65"
            dangerouslySetInnerHTML={{ __html: page.excerpt.rendered }}
          />
        </div>
      </div>

      <div className="panel p-6 md:p-8">
        <RichContent html={page.content.rendered} />
      </div>
    </article>
  );
}
