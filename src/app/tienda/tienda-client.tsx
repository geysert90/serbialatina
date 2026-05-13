"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

import { type StoreProduct } from "@/lib/store-db";
import { useCart } from "@/lib/cart-context";

export function TiendaClient({ initialProducts }: { initialProducts: StoreProduct[] }) {
  const [products] = useState(initialProducts);

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
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

      {products.length === 0 ? (
        <div className="reserved-slot min-h-[280px]">
          <div className="eyebrow w-fit bg-white/55">Sin productos</div>
          <p className="mt-auto max-w-2xl text-sm leading-7 text-black/55">
            No hay productos disponibles en este momento. Vuelve pronto.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
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

function ProductCard({ product }: { product: StoreProduct }) {
  const { addItem, openCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const stockLabel =
    product.quantity === 0
      ? "Agotado"
      : product.quantity <= 5
        ? `¡Solo ${product.quantity} quedan!`
        : `${product.quantity} disponibles`;

  const stockUrgent = product.quantity > 0 && product.quantity <= 5;
  const outOfStock = product.quantity === 0;

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
    <article className="story-card group flex flex-col overflow-hidden sm:flex-row">
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-gradient-to-br from-black/[0.02] to-black/[0.06] sm:w-56">
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

        <div className="absolute left-3 top-3 rounded-full border border-white/30 bg-white/80 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-black/50 backdrop-blur-sm">
          {product.storeName}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
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
          </div>
          <span className="shrink-0 text-xl font-bold tracking-[-0.03em] text-black">
            ${product.price.toFixed(2)}
          </span>
        </div>

        {product.description && (
          <p className="line-clamp-2 text-sm leading-6 text-black/55">
            {product.description}
          </p>
        )}

        <div className="mt-auto space-y-3">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              outOfStock
                ? "bg-red-50 text-red-600"
                : stockUrgent
                  ? "bg-amber-50 text-amber-700"
                  : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {stockLabel}
          </span>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-full border border-black/10 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={outOfStock}
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm text-black/50 transition hover:bg-black/5 hover:text-black disabled:opacity-30"
              >
                −
              </button>
              <span className="w-9 text-center text-sm font-semibold tabular-nums text-black">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) => Math.min(product.quantity, q + 1))
                }
                disabled={outOfStock || quantity >= product.quantity}
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm text-black/50 transition hover:bg-black/5 hover:text-black disabled:opacity-30"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition ${
                added
                  ? "bg-emerald-600"
                  : "bg-[var(--color-accent)] hover:-translate-y-0.5 hover:bg-black"
              } disabled:opacity-40 disabled:hover:translate-y-0`}
            >
              {added ? (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Agregado
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Agregar al carrito
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
