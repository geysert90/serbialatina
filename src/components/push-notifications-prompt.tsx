"use client";

import { useCallback, useEffect, useState } from "react";

const DISMISS_KEY = "serbialatina:v1:push-prompt-dismissed";
const ENABLED_KEY = "serbialatina:v1:push-enabled";

type PushKeyResponse = {
  publicKey: string;
};

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function isPushAlreadyEnabled(): boolean {
  if (typeof window === "undefined") return false;

  return window.localStorage.getItem(ENABLED_KEY) === "1";
}

function getDismissedAt(): number {
  if (typeof window === "undefined") return 0;

  return Number(window.localStorage.getItem(DISMISS_KEY) ?? "0") || 0;
}

function toUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (character) => character.charCodeAt(0));
}

async function getBrowserSubscription() {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export function PushNotificationsPrompt() {
  const [visible, setVisible] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean>(() => isPushSupported());
  const [isEnabled, setIsEnabled] = useState<boolean>(() => isPushAlreadyEnabled());
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const closePrompt = useCallback(() => {
    setVisible(false);
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, []);

  const handleEnable = useCallback(async () => {
    if (!isSupported || busy) return;

    setBusy(true);
    setFeedback(null);

    try {
      if (Notification.permission === "denied") {
        setFeedback("Tienes las notificaciones bloqueadas en el navegador.");
        closePrompt();
        return;
      }

      if (Notification.permission === "default") {
        const result = await Notification.requestPermission();
        if (result !== "granted") {
          setFeedback("No se activaron las notificaciones.");
          closePrompt();
          return;
        }
      }

      const keyResponse = await fetch("/api/push/keys", { cache: "no-store" });
      if (!keyResponse.ok) {
        throw new Error("No se pudo obtener la clave pública de notificaciones.");
      }

      const { publicKey } = (await keyResponse.json()) as PushKeyResponse;
      if (!publicKey) {
        throw new Error("La clave pública de notificaciones no está configurada.");
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await getBrowserSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: toUint8Array(publicKey) as BufferSource,
        });
      }

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        throw new Error(
          typeof body.error === "string" ? body.error : "No se pudo guardar la suscripción.",
        );
      }

      window.localStorage.setItem(ENABLED_KEY, "1");
      window.localStorage.removeItem(DISMISS_KEY);
      setIsEnabled(true);
      setVisible(false);
      setFeedback("Notificaciones activadas.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo activar la suscripción.";
      setFeedback(message);
    } finally {
      setBusy(false);
    }
  }, [busy, closePrompt, isSupported]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const dismissedAt = getDismissedAt();
      const dismissedRecently = dismissedAt > 0 && Date.now() - dismissedAt < 1000 * 60 * 60 * 24 * 7;

      if (isStandaloneMode() && isPushSupported() && !isPushAlreadyEnabled() && !dismissedRecently) {
        setVisible(true);
      }
    }, 8000);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!isSupported || !isStandaloneMode()) return;

    let cancelled = false;

    const syncSubscription = async () => {
      const subscription = await getBrowserSubscription().catch(() => null);
      if (!cancelled && subscription) {
        setIsEnabled(true);
        setVisible(false);
        window.localStorage.setItem(ENABLED_KEY, "1");
      }
    };

    syncSubscription();

    return () => {
      cancelled = true;
    };
  }, [isSupported]);

  if (!isSupported || isEnabled || (!visible && feedback === null)) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-3 z-[115] flex justify-center px-3 sm:bottom-4">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,251,244,0.92))] shadow-[0_18px_42px_-28px_rgba(0,0,0,0.34)] backdrop-blur-md sm:max-w-md">
        <div className="h-1.5 w-full bg-[linear-gradient(90deg,#1d4ed8_0%,#dc2626_100%)]" />

        <div className="flex items-start gap-3 p-3.5 sm:p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[rgba(29,78,216,0.1)] text-blue-700 shadow-inner shadow-white/70">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
              <path
                d="M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22Zm7-6.5V11a7 7 0 1 0-14 0v4.5L3 17v1h18v-1l-2-1.5Z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-blue-700">
              Notificaciones PWA
            </p>
            <h2 className="mt-1 text-[0.95rem] font-semibold leading-snug text-slate-950 sm:text-[1.02rem]">
              Recibe avisos de nuevas publicaciones
            </h2>
            <p className="mt-1.5 max-w-prose text-[0.82rem] leading-5 text-slate-700">
              Actívalas para enterarte cuando publiques noticias o eventos manualmente.
            </p>
            {feedback ? (
              <p className="mt-2 text-[0.78rem] font-medium text-slate-500">{feedback}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={closePrompt}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900"
            aria-label="Cerrar mensaje"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5">
              <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-black/5 bg-white/55 p-3.5 sm:p-4">
          <button
            type="button"
            onClick={closePrompt}
            className="inline-flex items-center justify-center rounded-full border border-[color:var(--color-border)] bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Ahora no
          </button>
          <button
            type="button"
            onClick={handleEnable}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-2))] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_10px_22px_-16px_rgba(17,17,17,0.5)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? "Activando..." : "Activar"}
          </button>
        </div>
      </div>
    </div>
  );
}
