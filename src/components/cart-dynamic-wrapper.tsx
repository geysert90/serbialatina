"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const CartInner = dynamic(
  () => import("@/components/cart-client-wrapper").then((m) => ({ default: m.CartClientWrapper })),
  { ssr: false },
);

export default function CartDynamicWrapper({ children }: { children: ReactNode }) {
  return <CartInner>{children}</CartInner>;
}
