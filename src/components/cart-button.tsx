"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";

export function CartButton() {
  const { totalItems, openCart } = useCart();
  const [bouncing, setBouncing] = useState(false);
  const prevTotalRef = { current: totalItems };

  useEffect(() => {
    if (totalItems > prevTotalRef.current) {
      setBouncing(true);
      const timer = setTimeout(() => setBouncing(false), 500);
      prevTotalRef.current = totalItems;
      return () => clearTimeout(timer);
    }
    prevTotalRef.current = totalItems;
  }, [totalItems]);

  return (
    <button
      type="button"
      onClick={openCart}
      className={`relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white/76 text-black shadow-[0_12px_30px_-22px_rgba(0,0,0,0.7)] transition hover:-translate-y-0.5 hover:bg-white ${
        bouncing ? "animate-cart-bounce" : ""
      }`}
      aria-label={`Abrir carrito${totalItems > 0 ? `, ${totalItems} productos` : ""}`}
      title="Carrito"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          d="M5 6h15l-1.6 8.2a2 2 0 0 1-2 1.6H8.2a2 2 0 0 1-2-1.6L4.6 3.8H2.8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <circle cx="8.8" cy="20" r="1.2" fill="currentColor" />
        <circle cx="17" cy="20" r="1.2" fill="currentColor" />
      </svg>

      {totalItems > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[0.6rem] font-bold text-white shadow">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </button>
  );
}
