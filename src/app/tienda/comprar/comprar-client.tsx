"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart, type CartItem } from "@/lib/cart-context";
import { FreeShippingBar } from "@/components/free-shipping-bar";
import { getShippingProgress, DEFAULT_SHIPPING } from "@/lib/shipping";

export function ComprarClient() {
  const { items, totalItems, totalPrice, clearCart, removeItem, updateQuantity } = useCart();
  const shipping = getShippingProgress(totalPrice, DEFAULT_SHIPPING);
  const shippingUnlocked = shipping.unlocked;
  const shippingCost = shippingUnlocked ? 0 : DEFAULT_SHIPPING.shippingCost;
  const orderTotal = totalPrice + shippingCost;
  const [submitted, setSubmitted] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    orderId: string;
    total: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const groupedByStore = useMemo(() => {
    const map = new Map<string, CartItem[]>();
    for (const item of items) {
      const key = item.storeName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [items]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Por favor completa nombre, email y teléfono.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tienda/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al procesar el pedido");
      }

      setOrderResult({
        orderId: data.order.orderId,
        total: data.order.total,
      });
      setSubmitted(true);
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el pedido");
    } finally {
      setLoading(false);
    }
  };

  /* ─── Empty cart ─── */
  if (items.length === 0 && !submitted) {
    return <EmptyCart />;
  }

  /* ─── Confirmation ─── */
  if (submitted && orderResult) {
    return (
      <section className="mx-auto w-full max-w-xl px-4 py-16 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-emerald-50">
          <svg className="h-12 w-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-6 text-3xl font-bold tracking-[-0.04em] text-black">
          ¡Pedido confirmado!
        </h2>
        <p className="mt-3 text-lg leading-8 text-black/50">
          Tu pedido <strong className="text-black">{orderResult.orderId}</strong> por{" "}
          <strong className="text-[var(--color-accent)]">
            {orderTotal.toLocaleString()} {DEFAULT_SHIPPING.currency}
          </strong> ha sido
          registrado exitosamente.
        </p>
        <div className="mt-6 rounded-2xl border border-black/6 bg-white p-5 text-left shadow-sm">
          <h3 className="text-sm font-semibold text-black">¿Qué sigue?</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-black/55">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-emerald-500">✓</span>
              El vendedor revisará tu pedido y se pondrá en contacto contigo.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-emerald-500">✓</span>
              Recibirás confirmación por email: <strong className="text-black/70">{form.email}</strong>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-emerald-500">✓</span>
              El pago y envío se coordinarán directamente con la tienda.
            </li>
          </ul>
        </div>
        <Link
          href="/tienda"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-black"
        >
          Seguir comprando
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </section>
    );
  }

  /* ─── Checkout form ─── */
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">
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
          Finalizar pedido
        </h1>
        <p className="text-lg leading-8 text-black/50">
          {totalItems} {totalItems === 1 ? "producto" : "productos"} ·{" "}
          {groupedByStore.length} {groupedByStore.length === 1 ? "tienda" : "tiendas"}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          {/* Left column - customer info */}
          <div className="space-y-8">
            {/* Contact info */}
            <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-semibold tracking-[-0.02em] text-black">
                Información de contacto
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-black/55">
                    Nombre completo <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    required
                    placeholder="Tu nombre"
                    className="w-full rounded-xl border border-black/10 bg-black/[0.01] px-4 py-3 text-sm text-black placeholder:text-black/20 transition focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-black/55">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    required
                    placeholder="tu@email.com"
                    className="w-full rounded-xl border border-black/10 bg-black/[0.01] px-4 py-3 text-sm text-black placeholder:text-black/20 transition focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-black/55">
                    Teléfono <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    required
                    placeholder="+381 64 1234567"
                    className="w-full rounded-xl border border-black/10 bg-black/[0.01] px-4 py-3 text-sm text-black placeholder:text-black/20 transition focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-black/55">
                    Dirección de envío
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Calle, número, ciudad"
                    className="w-full rounded-xl border border-black/10 bg-black/[0.01] px-4 py-3 text-sm text-black placeholder:text-black/20 transition focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-black/55">
                    Notas adicionales
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    placeholder="Instrucciones especiales para el vendedor..."
                    rows={3}
                    className="w-full rounded-xl border border-black/10 bg-black/[0.01] px-4 py-3 text-sm text-black placeholder:text-black/20 transition focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Order items */}
            <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-semibold tracking-[-0.02em] text-black">
                Tu pedido
              </h2>

              {groupedByStore.map(([storeName, storeItems]) => (
                <div key={storeName} className="mb-4 last:mb-0">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent)]/10">
                      <svg className="h-3.5 w-3.5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72l1.189-1.19A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 18h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-black">{storeName}</span>
                  </div>

                  <ul className="divide-y divide-black/[0.04] rounded-xl border border-black/6">
                    {storeItems.map((item) => (
                      <li key={item.productId} className="flex gap-3 p-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-black/[0.02]">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-black/8">
                              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                          <div className="min-w-0">
                            <Link href={`/tienda/${item.productId}`} className="text-sm font-medium text-black hover:text-[var(--color-accent)] line-clamp-1">
                              {item.name}
                            </Link>
                            <p className="text-xs text-black/35">×{item.quantity} · {item.price.toFixed(2)} RSD c/u</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-md text-xs text-black/30 hover:bg-black/5 hover:text-black/60"
                            >
                              −
                            </button>
                            <span className="w-5 text-center text-xs font-semibold tabular-nums">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-md text-xs text-black/30 hover:bg-black/5 hover:text-black/60"
                            >
                              +
                            </button>
                            <span className="w-16 text-right text-sm font-semibold tabular-nums">{(item.price * item.quantity).toFixed(2)} RSD</span>
                            <button
                              type="button"
                              onClick={() => removeItem(item.productId)}
                              className="rounded-full p-0.5 text-black/15 hover:text-red-400"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Right column - summary */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            {/* Free shipping progress */}
            {items.length > 0 && (
              <div className="mb-4">
                <FreeShippingBar currentTotal={totalPrice} config={DEFAULT_SHIPPING} />
              </div>
            )}

            <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-semibold tracking-[-0.02em] text-black">
                Resumen
              </h2>

              <div className="space-y-2 border-b border-black/6 pb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-black/50">Subtotal</span>
                  <span className="font-medium tabular-nums">{totalPrice.toLocaleString()} {DEFAULT_SHIPPING.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/50">Envío</span>
                  {shippingUnlocked ? (
                    <span className="font-semibold text-emerald-600">¡Gratis!</span>
                  ) : (
                    <span className="tabular-nums">
                      {DEFAULT_SHIPPING.shippingCost.toLocaleString()} {DEFAULT_SHIPPING.currency}
                      <span className="ml-1 text-black/30">({DEFAULT_SHIPPING.shippingLabel})</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-base font-semibold text-black">Total</span>
                <span className="text-2xl font-bold tracking-[-0.04em] text-[var(--color-accent)]">
                  {orderTotal.toLocaleString()} {DEFAULT_SHIPPING.currency}
                </span>
              </div>
              <p className="mt-1 text-right text-xs text-black/30">{totalItems} artículo{totalItems !== 1 && "s"}</p>

              {/* Error */}
              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-black hover:shadow-xl disabled:cursor-wait disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Procesando...
                  </>
                ) : (
                  <>
                    Realizar pedido
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>

              {/* Info */}
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <svg className="mt-px h-4 w-4 shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs leading-relaxed text-blue-600">
                    El pago y el envío se coordinarán directamente con la tienda después de confirmar tu pedido.
                  </p>
                </div>
              </div>
            </div>

            {/* Back */}
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
      </form>
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
