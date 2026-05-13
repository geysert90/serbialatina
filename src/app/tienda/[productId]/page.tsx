import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getStoreProduct } from "@/lib/store-db";
import { toAbsoluteUrl } from "@/lib/utils";
import { ProductDetailClient } from "./product-detail-client";

type Props = { params: Promise<{ productId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productId } = await params;
  const id = Number(productId);
  if (!Number.isFinite(id)) return { title: "Producto no encontrado" };

  const product = await getStoreProduct(id);
  if (!product) return { title: "Producto no encontrado" };

  return {
    title: `${product.name} · Tienda`,
    description: product.description ?? `Compra ${product.name} en Serbia Latina.`,
    alternates: { canonical: toAbsoluteUrl(`/tienda/${id}`) },
    openGraph: {
      title: `${product.name} · Serbia Latina`,
      description: product.description ?? `Compra ${product.name} en Serbia Latina.`,
      url: toAbsoluteUrl(`/tienda/${id}`),
      images: product.imageUrl ? [product.imageUrl] : [],
    },
  };
}

export default function ProductDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<ProductDetailFallback />}>
      <ProductDetailContent params={params} />
    </Suspense>
  );
}

function ProductDetailFallback() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
      <div className="h-5 w-48 animate-pulse rounded-full bg-black/5" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-2xl bg-black/5" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 animate-pulse rounded-xl bg-black/5" />
          <div className="h-10 w-32 animate-pulse rounded-xl bg-black/5" />
          <div className="h-28 animate-pulse rounded-xl bg-black/5" />
          <div className="h-12 w-full animate-pulse rounded-xl bg-black/5" />
        </div>
      </div>
    </section>
  );
}

async function ProductDetailContent({ params }: Props) {
  await connection();
  const { productId } = await params;
  const id = Number(productId);
  if (!Number.isFinite(id)) notFound();

  const product = await getStoreProduct(id);
  if (!product) notFound();

  return <ProductDetailClient product={product} />;
}
