import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { getStoreProducts, type StoreProduct } from "@/lib/store-db";
import { toAbsoluteUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tienda",
  description:
    "Productos de las tiendas de Serbia Latina: alimentos, bebidas, electrónica y más.",
  alternates: {
    canonical: toAbsoluteUrl("/tienda"),
  },
  openGraph: {
    title: "Tienda · Serbia Latina",
    description:
      "Explora productos de las tiendas de la comunidad latina en Serbia.",
    url: toAbsoluteUrl("/tienda"),
  },
};

export default function TiendaPage() {
  return (
    <Suspense fallback={<TiendaFallback />}>
      <TiendaContent />
    </Suspense>
  );
}

function TiendaFallback() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
      <div className="space-y-4">
        <div className="eyebrow w-fit">Serbia Latina</div>
        <div className="h-12 w-72 animate-pulse rounded-2xl bg-black/5" />
        <div className="h-6 w-96 animate-pulse rounded-2xl bg-black/5" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="min-h-[320px] animate-pulse rounded-[28px] border border-black/8 bg-white/45" />
        ))}
      </div>
    </section>
  );
}

async function TiendaContent() {
  await connection();
  const products = await getStoreProducts();

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="eyebrow w-fit">Serbia Latina</div>
          <h1 className="text-4xl font-semibold tracking-[-0.06em] text-black md:text-6xl">
            Tienda
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-black/60">
            Productos de nuestras tiendas asociadas. Cada producto te lleva
            directamente a la tienda para completar tu compra.
          </p>
        </div>

        {products.length > 0 && (
          <div className="flex flex-wrap gap-2 text-sm font-medium text-black/45">
            <span className="rounded-full border border-black/10 bg-white px-4 py-2">
              {products.length} {products.length === 1 ? "producto" : "productos"}
            </span>
            <span className="rounded-full border border-black/10 bg-white px-4 py-2">
              Pago seguro
            </span>
            <span className="rounded-full border border-black/10 bg-white px-4 py-2">
              Envío a Serbia
            </span>
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div className="reserved-slot min-h-[280px]">
          <div className="eyebrow w-fit bg-white/55">Sin productos</div>
          <p className="mt-auto max-w-2xl text-sm leading-7 text-black/55">
            No hay productos disponibles en este momento. Vuelve pronto para
            descubrir nuevas ofertas de nuestras tiendas.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <div className="rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              ¿Tienes una tienda?
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-black">
              Vende en Serbia Latina
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-black/60">
              ¿Tienes productos que quieras vender a la comunidad hispana en
              Serbia? Escríbenos y te ayudamos a configurar tu tienda.
            </p>
          </div>
          <Link
            href="/contacto"
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Contactar →
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: StoreProduct }) {
  const stockLabel =
    product.quantity === 0
      ? "Agotado"
      : product.quantity <= 5
        ? `¡Solo ${product.quantity} quedan!`
        : `${product.quantity} disponibles`;

  const stockUrgent = product.quantity > 0 && product.quantity <= 5;

  return (
    <article className="story-card group flex h-full flex-col overflow-hidden">
      {/* Product image */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-black/[0.02] to-black/[0.06]">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              className="h-16 w-16 text-black/10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
        )}

        {/* Price badge */}
        <div className="absolute left-4 top-4 rounded-full bg-black/75 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
          ${product.price.toFixed(2)}
        </div>

        {/* Store badge */}
        <div className="absolute right-4 top-4 rounded-full border border-white/40 bg-white/80 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-black/55 backdrop-blur-sm">
          {product.storeName}
        </div>
      </div>

      {/* Product info */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h2 className="text-lg font-semibold leading-snug tracking-[-0.03em] text-black">
          <a
            href={product.storeUrl}
            target="_blank"
            rel="noreferrer"
            className="underline-offset-4 hover:underline"
          >
            {product.name}
          </a>
        </h2>

        {product.description && (
          <p className="line-clamp-2 text-sm leading-6 text-black/55">
            {product.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              product.quantity === 0
                ? "bg-red-50 text-red-600"
                : stockUrgent
                  ? "bg-amber-50 text-amber-700"
                  : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {stockLabel}
          </span>

          <a
            href={product.storeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
          >
            Comprar ↗
          </a>
        </div>
      </div>
    </article>
  );
}
