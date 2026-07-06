"use client";

import { CartProvider } from "@/lib/cart-context";
import { CartDrawer } from "@/components/cart-drawer";
import type { ReactNode } from "react";

export function CartClientWrapper({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  );
}
