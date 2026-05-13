"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

import { type StoreProduct } from "@/lib/store-db";
import { useCart } from "@/lib/cart-context";
import { FreeShippingBar } from "@/components/free-shipping-bar";

export function ProductDetailClient({ product }: { product: StoreProduct }) {
  const { addItem, openCart, totalPrice } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const outOfStock = product.quantity === 0;
  const lowStock = product.quantity > 0 && product.quantity <= 5;

  const stockLabel =
    product.quantity === 0
      ? "Producto agotado"
      : product.quantity <= 5
        ? `¡Solo quedan ${product.quantity}!`
        : `${product.quantity} unidades disponibles`;

  const handleAddToCart = useCallback(() => {
    if (outOfStock) return;
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        storeUrl: product.storeUrl,
        storeName: product.storeName,
      },
      quantity
    );
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 1500);
  }, [product, quantity, addItem, openCart, outOfStock]);

  const handleBuyNow = useCallback(() => {
    if (outOfStock) return;
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        storeUrl: product.storeUrl,
        storeName: product.storeName,
      },
      quantity
    );
    window.open(product.storeUrl, "_blank");
  }, [product, quantity, addItem, outOfStock]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-black/35">
        <Link href="/tienda" className="transition-colors hover:text-[var(--color-accent)]">
          Tienda
        </Link>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-black/25">{product.storeName}</span>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="truncate text-black/55">{product.name}</span>
      </nav>

      {/* Product layout */}
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        {/* Image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-br from-black/[0.01] to-black/[0.04] ring-1 ring-black/6">
          {product.imageUrl && !imgError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg className="h-24 w-24 text-black/8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
          )}

          {/* Stock badge overlay */}
          <span
            className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-sm ${
              outOfStock
                ? "bg-red-500/15 text-red-600 ring-1 ring-red-200/50"
                : lowStock
                  ? "bg-amber-500/15 text-amber-700 ring-1 ring-amber-200/50"
                  : "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-200/50"
            }`}
          >
            {outOfStock ? "Agotado" : lowStock ? "Pocas unidades" : "Disponible"}
          </span>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-6">
          {/* Store badge */}
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-black/8 bg-white px-3 py-1.5 text-xs font-semibold text-black/45 transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72l1.189-1.19A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 18h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
            </svg>
            Vendido por {product.storeName}
          </span>

          {/* Product name */}
          <h1 className="text-3xl font-bold tracking-[-0.04em] text-black md:text-4xl">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-[-0.04em] text-[var(--color-accent)] md:text-5xl">
              {product.price.toFixed(2)} RSD
            </span>
            {product.price > 0 && (
              <span className="text-sm text-black/35">+ envío</span>
            )}
          </div>

          {/* Stock */}
          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${
              outOfStock
                ? "border-red-200 bg-red-50 text-red-600"
                : lowStock
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-600"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                outOfStock ? "bg-red-400" : lowStock ? "bg-amber-400" : "bg-emerald-400"
              }`}
            />
            {stockLabel}
          </span>

          {/* Description */}
          {product.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-black/55">Descripción</h3>
              <p className="text-sm leading-7 text-black/60">{product.description}</p>
            </div>
          )}

          {/* Free shipping progress */}
          <FreeShippingBar currentTotal={totalPrice} compact />

          {/* Quantity selector */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-black/55">Cantidad</h3>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={outOfStock}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-medium text-black/40 transition hover:bg-black/5 hover:text-black disabled:opacity-25"
              >
                −
              </button>
              <span className="w-12 text-center text-lg font-semibold tabular-nums text-black">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(product.quantity, q + 1))}
                disabled={outOfStock || quantity >= product.quantity}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-medium text-black/40 transition hover:bg-black/5 hover:text-black disabled:opacity-25"
              >
                +
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Add to cart */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold transition-all duration-300 ${
                added
                  ? "bg-emerald-500 text-white"
                  : "border-2 border-[var(--color-accent)] bg-white text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white"
              } disabled:cursor-not-allowed disabled:border-black/10 disabled:text-black/20 disabled:hover:bg-white`}
            >
              {added ? (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  ¡Agregado!
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  Agregar al carrito
                </>
              )}
            </button>

            {/* Buy now */}
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={outOfStock}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-black hover:shadow-xl disabled:cursor-not-allowed disabled:bg-black/20 disabled:shadow-none disabled:hover:translate-y-0"
            >
              Comprar ahora
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>

          {/* Store info */}
          <div className="rounded-xl border border-black/6 bg-gradient-to-r from-black/[0.01] to-transparent p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)]/10">
                <svg className="h-5 w-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72l1.189-1.19A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 18h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-black">{product.storeName}</p>
                <p className="truncate text-xs text-black/35">
                  Producto original de {product.storeName} en store.segun2idioma.com
                </p>
              </div>
            </div>
          </div>

          {/* Back link */}
          <Link
            href="/tienda"
            className="inline-flex items-center gap-2 text-sm font-medium text-black/35 transition-colors hover:text-black/60"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Volver a la tienda
          </Link>
        </div>
      </div>
    </section>
  );
}
