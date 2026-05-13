import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";

import { getStoreProducts, type StoreProduct } from "@/lib/store-db";
import { toAbsoluteUrl } from "@/lib/utils";
import { TiendaClient } from "./tienda-client";

export const metadata: Metadata = {
  title: "Tienda",
  description:
    "Productos de las tiendas de Serbia Latina: alimentos, bebidas, electrónica y más.",
  alternates: {
    canonical: toAbsoluteUrl("/tienda"),
  },
  openGraph: {
    title: "Tienda · Serbia Latina",
    description:
      "Explora productos de las tiendas de la comunidad latina en Serbia.",
    url: toAbsoluteUrl("/tienda"),
  },
};

export default function TiendaPage() {
  return (
    <Suspense fallback={<TiendaFallback />}>
      <TiendaContent />
    </Suspense>
  );
}

function TiendaFallback() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
      <div className="space-y-4">
        <div className="eyebrow w-fit">Serbia Latina</div>
        <div className="h-12 w-72 animate-pulse rounded-2xl bg-black/5" />
        <div className="h-6 w-96 animate-pulse rounded-2xl bg-black/5" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="min-h-[320px] animate-pulse rounded-[28px] border border-black/8 bg-white/45" />
        ))}
      </div>
    </section>
  );
}

async function TiendaContent() {
  await connection();
  const products = await getStoreProducts();

  return <TiendaClient initialProducts={products} />;
}
