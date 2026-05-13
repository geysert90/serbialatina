"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

import { type StoreProduct } from "@/lib/store-db";
import { useCart } from "@/lib/cart-context";

export function TiendaClient({ initialProducts }: { initialProducts: StoreProduct[] }) {
  const [products] = useState(initialProducts);

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="eyebrow w-fit">Serbia Latina</div>
          <h1 className="text-4xl font-semibold tracking-[-0.06em] text-black md:text-6xl">
            Tienda
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-black/60">
            Productos de nuestras tiendas asociadas. Agrega al carrito y compra
            directamente en la tienda de origen.
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

      {/* Product grid */}
      {products.length === 0 ? (
        <div className="reserved-slot min-h-[280px]">
          <div className="eyebrow w-fit bg-white/55">Sin productos</div>
          <p className="mt-auto max-w-2xl text-sm leading-7 text-black/55">
            No hay productos disponibles en este momento. Vuelve pronto.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 lg:gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Sell with us banner */}
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
              ¿Tienes productos para vender a la comunidad hispana en Serbia?
              Escríbenos y te ayudamos a configurar tu tienda.
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

/* ───── Product Card ───── */

function ProductCard({ product }: { product: StoreProduct }) {
  const { addItem, openCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const outOfStock = product.quantity === 0;
  const lowStock = product.quantity > 0 && product.quantity <= 5;

  const stockLabel =
    product.quantity === 0
      ? "Agotado"
      : product.quantity <= 5
        ? `Solo ${product.quantity}`
        : `${product.quantity} disp.`;

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
    setTimeout(() => setAdded(false), 1200);
  }, [product, quantity, addItem, openCart, outOfStock]);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-black/8 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-black/12 hover:shadow-lg hover:shadow-black/5">
      {/* Image */}
      <Link href={`/tienda/${product.id}`} className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-black/[0.01] to-black/[0.04]">
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

        {/* Store badge */}
        <span className="absolute left-2 top-2 rounded-full border border-white/50 bg-white/80 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-black/50 backdrop-blur-sm">
          {product.storeName}
        </span>

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-black/60">
              Agotado
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-3.5">
        {/* Name */}
        <h3 className="line-clamp-2 text-[0.8rem] font-semibold leading-snug tracking-[-0.015em] text-black sm:text-sm">
          <Link
            href={`/tienda/${product.id}`}
            className="transition-colors hover:text-[var(--color-accent)]"
          >
            {product.name}
          </Link>
        </h3>

        {/* Price */}
        <span className="text-base font-bold tracking-[-0.03em] text-[var(--color-accent)] sm:text-lg">
          {product.price.toFixed(2)} RSD
        </span>

        {/* Description */}
        {product.description && (
          <p className="line-clamp-2 hidden text-[0.7rem] leading-relaxed text-black/40 sm:block">
            {product.description}
          </p>
        )}

        {/* Stock badge */}
        <div className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              outOfStock ? "bg-red-400" : lowStock ? "bg-amber-400" : "bg-emerald-400"
            }`}
          />
          <span
            className={`text-[0.6rem] font-medium ${
              outOfStock ? "text-red-500" : lowStock ? "text-amber-600" : "text-emerald-600"
            }`}
          >
            {stockLabel}
          </span>
        </div>

        {/* Controls */}
        <div className="mt-auto flex flex-col gap-2 pt-1">
          {/* Quantity */}
          <div className="flex items-center justify-between rounded-lg border border-black/6 bg-black/[0.02] px-1.5 py-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={outOfStock}
              className="flex h-7 w-7 items-center justify-center rounded-md text-xs text-black/40 transition hover:bg-black/5 hover:text-black disabled:opacity-25"
            >
              −
            </button>
            <span className="text-xs font-semibold tabular-nums text-black">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(product.quantity, q + 1))}
              disabled={outOfStock || quantity >= product.quantity}
              className="flex h-7 w-7 items-center justify-center rounded-md text-xs text-black/40 transition hover:bg-black/5 hover:text-black disabled:opacity-25"
            >
              +
            </button>
          </div>

          {/* Add to cart */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-all duration-200 ${
              added
                ? "scale-[0.97] bg-emerald-500"
                : "bg-[var(--color-accent)] hover:bg-black active:scale-[0.97]"
            } disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--color-accent)]`}
          >
            {added ? (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Agregado
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                Agregar
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
