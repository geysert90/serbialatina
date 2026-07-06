"use client";

import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import type { StoreProduct } from "@/lib/store-db";

function ProductCard({ product }: { product: StoreProduct }) {
  const outOfStock = product.stockStatus === "outofstock";
  const lowStock = product.manageStock && product.quantity > 0 && product.quantity <= 5;
  const showStockBadge = outOfStock || lowStock;
  const stockLabel = outOfStock ? "Agotado" : lowStock ? `Solo ${product.quantity}` : "";

  return (
    <Link
      href={`/tienda/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-black/8 bg-white transition hover:-translate-y-1 hover:border-black/12 hover:shadow-lg"
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-black/[0.01] to-black/[0.04]">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-black/10">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
        )}

        {/* Stock badge — only when out of stock or low stock */}
        {showStockBadge && (
          <div className="absolute left-2 top-2">
            <span
              className={
                outOfStock
                  ? "rounded-full bg-red-100 px-2.5 py-0.5 text-[0.65rem] font-semibold text-red-700"
                  : "rounded-full bg-amber-100 px-2.5 py-0.5 text-[0.65rem] font-semibold text-amber-700"
              }
            >
              {stockLabel}
            </span>
          </div>
        )}

        {/* Price badge */}
        <div className="absolute bottom-2 right-2 rounded-full bg-black/75 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
          {product.price.toLocaleString("es-ES")} RSD
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-black group-hover:text-[var(--color-accent)]">
          {product.name}
        </p>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-black/35">
          {product.storeName}
        </p>
      </div>
    </Link>
  );
}

export function HomeProductsSection({ products }: { products: StoreProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="border-t border-black/5 bg-gradient-to-b from-white to-amber-50/30 px-4 py-5 md:rounded-2xl md:px-6 md:py-6">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 border-b border-black/8 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="eyebrow w-fit">Tienda</div>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-black md:text-3xl">
            Productos destacados
          </h2>
          <p className="max-w-xl text-sm leading-7 text-black/55">
            Explora productos de nuestras tiendas asociadas.
          </p>
        </div>
        <Link
          href="/tienda"
          className="inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
        >
          Ver tienda completa →
        </Link>
      </div>

      {/* Simple 2-column grid on mobile, 4-column on desktop */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 sm:gap-4">
        {products.slice(0, 8).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
