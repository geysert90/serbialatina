"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MisProductosClient } from "./mis-productos-client";

export default function MisProductosPage() {
  const router = useRouter();
  const [state, setState] = useState<{
    status: "approved" | "pending" | "none";
    storeName: string;
    appPassword: string | null;
    wpUsername: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let userData: any;
    fetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) throw new Error("not authenticated");
        return r.json();
      })
      .then((data) => {
        userData = data;
        return fetch(`/api/vendor/status?wp_user_id=${data.id}`).then((r) => r.json());
      })
      .then((data) => {
        if (data.status === "none") {
          router.push("/vender");
          return;
        }
        setState({
          status: data.status,
          storeName: data.store_name || "",
          appPassword: data.app_password || null,
          wpUsername: userData?.wpUsername || "",
        });
      })
      .catch(() => {
        router.push("/acceso?redirect=/tienda/mis-productos");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 md:px-8 md:py-12">
        <div className="h-8 w-48 animate-pulse rounded-full bg-black/5" />
        {[1, 2, 3].map((i) => (<div key={i} className="h-20 animate-pulse rounded-2xl bg-black/5" />))}
      </section>
    );
  }

  if (!state || state.status === "none") return null;

  return (
    <MisProductosClient
      storeStatus={state.status as "approved" | "pending"}
      storeName={state.storeName}
      appPassword={state.appPassword}
      wpUsername={state.wpUsername}
    />
  );
}
