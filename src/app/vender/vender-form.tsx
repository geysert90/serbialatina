"use client";

import { useState, type FormEvent } from "react";

import { solicitarTienda } from "./actions";

export function VenderForm({
  wpUserId,
  userName,
  userEmail,
  existingWhatsapp,
}: {
  wpUserId: string;
  userName: string;
  userEmail: string;
  existingWhatsapp: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    status: "pending" | "approved" | "exists" | "none";
    message?: string;
  } | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const storeName = (form.get("store_name") as string).trim();
    const whatsapp = (form.get("whatsapp") as string).trim();

    if (!storeName) {
      setError("El nombre de la tienda es obligatorio.");
      setLoading(false);
      return;
    }

    try {
      const res = await solicitarTienda(wpUserId, storeName, whatsapp);
      if (res.error) {
        setError(res.error);
      } else {
        setResult(res);
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <section className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 py-16 md:px-8">
        {result.status === "pending" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.05em] text-black">
              ¡Solicitud enviada!
            </h1>
            <p className="text-lg leading-7 text-black/60">
              Tu tienda está <strong>pendiente de aprobación</strong>. Un administrador la revisará pronto.
            </p>
            <p className="text-sm leading-6 text-black/40">
              Recibirás un email cuando tu tienda esté activa.
            </p>
          </div>
        )}

        {result.status === "exists" && (
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
              Tu tienda ya está activa. Gestioná tus productos desde el dashboard.
            </p>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 py-12 md:px-8">
      <div className="space-y-3">
        <div className="eyebrow w-fit">Marketplace</div>
        <h1 className="text-4xl font-semibold tracking-[-0.06em] text-black">
          Abrí tu tienda
        </h1>
        <p className="text-lg leading-8 text-black/60">
          Hola <strong>{userName}</strong>, solo necesitamos el nombre de tu tienda.
          Cobramos <strong>10% de comisión</strong> por venta.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-black/70">Nombre de tu tienda *</span>
          <input
            name="store_name"
            required
            className="rounded-xl border border-black/15 px-4 py-3 text-sm outline-none transition focus:border-black/40"
            placeholder="Mi Tienda Latina"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-black/70">
            WhatsApp {existingWhatsapp ? "(ya lo tenés)" : ""}
          </span>
          <input
            name="whatsapp"
            defaultValue={existingWhatsapp}
            className="rounded-xl border border-black/15 px-4 py-3 text-sm outline-none transition focus:border-black/40"
            placeholder="+381 64 1234567"
          />
          <span className="text-xs text-black/35">
            Lo usaremos para coordinar tus ventas.
          </span>
        </label>

        <div className="rounded-xl border border-black/5 bg-black/[0.02] p-4 text-xs leading-5 text-black/45">
          Usuario: <strong className="text-black/60">{userEmail}</strong>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
        >
          {loading ? "Enviando solicitud..." : "Solicitar tienda →"}
        </button>
      </form>
    </section>
  );
}
