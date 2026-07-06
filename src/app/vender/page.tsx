"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { VenderForm } from "./vender-form";

type VendorState = {
  status: "approved" | "pending" | "none";
  storeName?: string;
};

export default function VenderPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<{
    wpUserId: string;
    userName: string;
    userEmail: string;
    whatsapp: string;
  } | null>(null);
  const [vendor, setVendor] = useState<VendorState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) throw new Error("not authenticated");
        return r.json();
      })
      .then((data) => {
        setAuth({
          wpUserId: String(data.id),
          userName: data.name,
          userEmail: data.email,
          whatsapp: data.whatsapp || "",
        });
        // Check vendor status
        return fetch(`/api/vendor/status?wp_user_id=${data.id}`).then((r) =>
          r.json()
        );
      })
      .then((data) => {
        setVendor({
          status: data.status || "none",
          storeName: data.store_name,
        });
      })
      .catch(() => {
        router.push("/acceso?redirect=/vender");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <section className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 py-12 md:px-8">
        <div className="h-8 w-48 animate-pulse rounded-full bg-black/5" />
        <div className="h-6 w-96 animate-pulse rounded-xl bg-black/5" />
        <div className="h-12 animate-pulse rounded-xl bg-black/5" />
        <div className="h-12 animate-pulse rounded-xl bg-black/5" />
      </section>
    );
  }

  if (!auth) return null;

  // Already has a store
  if (vendor?.status === "approved") {
    return (
      <section className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 py-16 md:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.05em] text-black">
            Ya tienes una tienda
          </h1>
          <p className="text-lg leading-7 text-black/60">
            <strong>{vendor.storeName}</strong> está activa. Gestioná tus productos, pedidos y más desde el dashboard.
          </p>
        </div>
        <Link
          href="/tienda/mis-productos"
          className="rounded-full bg-[var(--color-accent)] px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-black"
        >
          Ir a mi dashboard →
        </Link>
      </section>
    );
  }

  // Pending approval
  if (vendor?.status === "pending") {
    return (
      <section className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 py-16 md:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.05em] text-black">
            Tienda en revisión
          </h1>
          <p className="text-lg leading-7 text-black/60">
            <strong>{vendor.storeName}</strong> está pendiente de aprobación. La administración se pondrá en contacto pronto.
          </p>
        </div>
      </section>
    );
  }

  return (
    <VenderForm
      wpUserId={auth.wpUserId}
      userName={auth.userName}
      userEmail={auth.userEmail}
      existingWhatsapp={auth.whatsapp}
    />
  );
}
