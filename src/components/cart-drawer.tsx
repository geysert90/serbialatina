"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { FreeShippingBar } from "@/components/free-shipping-bar";

export function CartDrawer() {
  const router = useRouter();
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    totalPrice,
    totalItems,
  } = useCart();

  const [animatingOut, setAnimatingOut] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sync animatingOut with isOpen
  useEffect(() => {
    if (!isOpen) setAnimatingOut(false);
  }, [isOpen]);

  const handleClose = () => {
    setAnimatingOut(true);
    setTimeout(() => {
      closeCart();
      setAnimatingOut(false);
    }, 250);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen && !animatingOut) return null;

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-50 flex justify-end transition-colors duration-300 ${
        animatingOut ? "bg-black/0" : "bg-black/30 backdrop-blur-sm"
      }`}
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
    >
      {/* Drawer panel */}
      <div
        className={`flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          animatingOut ? "translate-x-full" : "translate-x-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/6 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-black">
              Carrito
            </h2>
            <p className="mt-0.5 text-sm text-black/45">
              {totalItems} {totalItems === 1 ? "producto" : "productos"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-black/40 transition hover:bg-black/5 hover:text-black/70"
            aria-label="Cerrar carrito"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Free shipping bar */}
          {items.length > 0 && (
            <div className="mb-4">
              <FreeShippingBar currentTotal={totalPrice} compact />
            </div>
          )}

          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
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
              <p className="text-sm font-medium text-black/35">Tu carrito está vacío</p>
              <button
                type="button"
                onClick={handleClose}
                className="text-sm font-semibold text-[var(--color-accent)] hover:underline"
              >
                Seguir comprando
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item, index) => (
                <li
                  key={item.productId}
                  className="animate-slide-in-right rounded-2xl border border-black/6 bg-white p-4 shadow-sm"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-black/[0.03]">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <svg className="h-8 w-8 text-black/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-semibold leading-snug text-black">
                          {item.name}
                        </h3>
                        <p className="mt-0.5 text-xs text-black/40">{item.storeName}</p>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 text-sm font-medium text-black/50 transition hover:bg-black/5 hover:text-black"
                          >
                            −
                          </button>
                          <span className="w-7 text-center text-sm font-semibold tabular-nums text-black">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 text-sm font-medium text-black/50 transition hover:bg-black/5 hover:text-black"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-black">
                            {(item.price * item.quantity).toFixed(2)} RSD
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="rounded-full p-1 text-black/25 transition hover:bg-red-50 hover:text-red-500"
                            aria-label={`Eliminar ${item.name}`}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-black/6 px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-black/55">Total</span>
              <span className="text-2xl font-bold tracking-[-0.04em] text-black">
                {totalPrice.toFixed(2)} RSD
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                closeCart();
                router.push("/tienda/comprar");
              }}
              className="w-full rounded-full bg-[var(--color-accent)] px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-black hover:shadow-xl"
            >
              Comprar ahora
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="mt-3 w-full rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-medium text-black/55 transition hover:bg-black/5"
            >
              Seguir comprando
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
