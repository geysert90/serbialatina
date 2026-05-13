import type { Metadata } from "next";
import { toAbsoluteUrl } from "@/lib/utils";
import { ComprarClient } from "./comprar-client";

export const metadata: Metadata = {
  title: "Checkout · Tienda",
  description: "Revisa tu pedido y completa tu compra en las tiendas asociadas.",
  alternates: { canonical: toAbsoluteUrl("/tienda/comprar") },
  openGraph: {
    title: "Checkout · Serbia Latina",
    description: "Revisa tu pedido y completa tu compra.",
    url: toAbsoluteUrl("/tienda/comprar"),
  },
};

export default function ComprarPage() {
  return <ComprarClient />;
}
