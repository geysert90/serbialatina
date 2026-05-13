"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useCart, type CartItem } from "@/lib/cart-context";

export function ComprarClient() {
  const { items, totalItems, totalPrice, clearCart, removeItem, updateQuantity } = useCart();

  const groupedByStore = useMemo(() => {
    const map = new Map<string, CartItem[]>();
    for (const item of items) {
      const key = item.storeName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [items]);

  if (items.length === 0) {
    return <EmptyCart />;
  }

  const handleStoreBuy = (storeItems: CartItem[]) => {
    storeItems.forEach((item) => {
      window.open(item.storeUrl, "_blank");
    });
  };

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-black/35">
        <Link href="/tienda" className="transition-colors hover:text-[var(--color-accent)]">
          Tienda
        </Link>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium text-black/55">Checkout</span>
      </nav>

      {/* Header */}
      <div className="mb-10 space-y-3">
        <div className="eyebrow w-fit">Serbia Latina</div>
        <h1 className="text-4xl font-semibold tracking-[-0.06em] text-black md:text-5xl">
          Revisa tu pedido
        </h1>
        <p className="text-lg leading-8 text-black/50">
          {totalItems} {totalItems === 1 ? "producto" : "productos"} en tu carrito ·{" "}
          {groupedByStore.length} {groupedByStore.length === 1 ? "tienda" : "tiendas"}
        </p>
      </div>

      {/* Steps indicator */}
      <div className="mb-10 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">
            1
          </span>
          <span className="text-sm font-semibold text-black">Revisar</span>
        </div>
        <div className="h-px flex-1 bg-black/8" />
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-sm font-bold text-black/35">
            2
          </span>
          <span className="text-sm font-medium text-black/30">Comprar</span>
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Items list */}
        <div className="space-y-8">
          {groupedByStore.map(([storeName, storeItems]) => {
            const storeTotal = storeItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

            return (
              <div
                key={storeName}
                className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm"
              >
                {/* Store header */}
                <div className="flex items-center justify-between border-b border-black/4 bg-gradient-to-r from-black/[0.01] to-transparent px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/10">
                      <svg className="h-4 w-4 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72l1.189-1.19A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 18h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-black">{storeName}</p>
                      <p className="text-xs text-black/35">
                        {storeItems.length} {storeItems.length === 1 ? "producto" : "productos"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-black/55">
                    ${storeTotal.toFixed(2)}
                  </span>
                </div>

                {/* Products */}
                <ul className="divide-y divide-black/[0.03]">
                  {storeItems.map((item) => (
                    <li key={item.productId} className="flex gap-4 px-5 py-4">
                      {/* Thumbnail */}
                      <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-black/[0.02] ring-1 ring-black/[0.04]">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-black/8">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          <Link
                            href={`/tienda/${item.productId}`}
                            className="text-sm font-semibold leading-snug text-black transition-colors hover:text-[var(--color-accent)]"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-0.5 text-xs text-black/35">
                            ${item.price.toFixed(2)} c/u
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          {/* Quantity */}
                          <div className="flex items-center gap-1 rounded-lg border border-black/6 bg-black/[0.01] p-0.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium text-black/40 transition hover:bg-black/5 hover:text-black"
                            >
                              −
                            </button>
                            <span className="w-7 text-center text-xs font-semibold tabular-nums text-black">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium text-black/40 transition hover:bg-black/5 hover:text-black"
                            >
                              +
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold tabular-nums text-black">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeItem(item.productId)}
                              className="rounded-full p-1 text-black/20 transition hover:bg-red-50 hover:text-red-500"
                              aria-label={`Eliminar ${item.name}`}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Store buy button */}
                <div className="border-t border-black/4 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => handleStoreBuy(storeItems)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-black/8 transition-all duration-300 hover:-translate-y-0.5 hover:bg-black hover:shadow-lg"
                  >
                    Comprar en {storeName}
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar - Order summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold tracking-[-0.02em] text-black">
              Resumen del pedido
            </h2>

            <div className="space-y-3 border-b border-black/6 pb-4">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between text-sm">
                  <span className="min-w-0 truncate text-black/55">
                    {item.name}
                    <span className="ml-1 text-black/25">×{item.quantity}</span>
                  </span>
                  <span className="ml-3 shrink-0 tabular-nums font-medium text-black">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-base font-semibold text-black">Total</span>
              <span className="text-2xl font-bold tracking-[-0.04em] text-[var(--color-accent)]">
                ${totalPrice.toFixed(2)}
              </span>
            </div>

            <p className="mt-1 text-right text-xs text-black/30">
              {totalItems} {totalItems === 1 ? "artículo" : "artículos"}
            </p>

            {/* Info box */}
            <div className="mt-5 space-y-2 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
              <div className="flex items-start gap-2">
                <svg className="mt-px h-4 w-4 shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs leading-relaxed text-blue-600">
                  Al hacer clic en <strong>Comprar</strong> serás redirigido a la tienda original
                  en <strong>store.segun2idioma.com</strong> para completar tu pedido de forma segura.
                </p>
              </div>
            </div>
          </div>

          {/* Back to shop */}
          <div className="mt-4 flex gap-3">
            <Link
              href="/tienda"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-black/8 bg-white px-5 py-3 text-sm font-medium text-black/55 transition hover:bg-black/[0.02] hover:text-black"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              Seguir comprando
            </Link>
            <button
              type="button"
              onClick={clearCart}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-medium text-red-500 transition hover:bg-red-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Vaciar
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

/* ───── Empty cart ───── */

function EmptyCart() {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-20 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-black/[0.02] ring-1 ring-black/[0.04]">
        <svg className="h-12 w-12 text-black/8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      </div>
      <h2 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-black">
        Tu carrito está vacío
      </h2>
      <p className="mt-2 text-sm leading-7 text-black/45">
        Agrega productos desde la tienda para comenzar tu pedido.
      </p>
      <Link
        href="/tienda"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-black"
      >
        Explorar productos
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </Link>
    </section>
  );
}
