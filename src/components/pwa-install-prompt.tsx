"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DISMISS_KEY = "serbialatina:v2:pwa-install-dismissed";
const INSTALLED_KEY = "serbialatina:v2:pwa-installed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.localStorage.getItem(INSTALLED_KEY) === "1"
  );
}

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 900;
}

function getDismissedAt(): number {
  if (typeof window === "undefined") return 0;
  return Number(window.sessionStorage.getItem(DISMISS_KEY) ?? "0") || 0;
}

export function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => isMobileDevice());
  const [isInstalled, setIsInstalled] = useState<boolean>(() => isStandaloneMode());
  const [installHint, setInstallHint] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  const closePrompt = useCallback(() => {
    setVisible(false);
    window.sessionStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, []);

  const handleInstall = useCallback(async () => {
    const deferred = deferredPromptRef.current;

    if (!deferred) {
      setInstallHint(true);
      window.sessionStorage.setItem(DISMISS_KEY, String(Date.now()));
      return;
    }

    deferredPromptRef.current = null;

    try {
      await deferred.prompt();
      const result = await deferred.userChoice;

      if (result.outcome === "accepted") {
        window.localStorage.setItem(INSTALLED_KEY, "1");
        window.sessionStorage.removeItem(DISMISS_KEY);
        setIsInstalled(true);
        setVisible(false);
      }
    } finally {
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPromptRef.current = event as BeforeInstallPromptEvent;
    };

    const onAppInstalled = () => {
      deferredPromptRef.current = null;
      window.localStorage.setItem(INSTALLED_KEY, "1");
      window.sessionStorage.removeItem(DISMISS_KEY);
      setIsInstalled(true);
      setVisible(false);
    };

    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const onMediaChange = () => setIsMobile(isMobileDevice());

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    mediaQuery.addEventListener?.("change", onMediaChange);
    mediaQuery.addListener?.(onMediaChange);

    const timer = window.setTimeout(() => {
      const dismissedAt = getDismissedAt();
      const dismissedRecently = dismissedAt > 0 && Date.now() - dismissedAt < 1000 * 60 * 60 * 24;
      if (!dismissedRecently && !isStandaloneMode() && isMobileDevice()) {
        setVisible(true);
      }
    }, 5000);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      mediaQuery.removeEventListener?.("change", onMediaChange);
      mediaQuery.removeListener?.(onMediaChange);
    };
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Progressive enhancement only.
      });
    }
  }, []);

  const title = useMemo(() => {
    if (installHint) {
      return "Tu navegador no mostró la instalación automática";
    }

    return "¿Desea instalar la aplicación de Serbia Latina?";
  }, [installHint]);

  if (!isMobile || isInstalled || !visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-3 z-[120] flex justify-center px-3 sm:bottom-4">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,251,244,0.9))] shadow-[0_18px_42px_-28px_rgba(0,0,0,0.34)] backdrop-blur-md sm:max-w-md">
        <div className="h-1.5 w-full bg-[linear-gradient(90deg,var(--color-accent)_0%,var(--color-accent-2)_100%)]" />

        <div className="flex items-start gap-3 p-3.5 sm:p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_12px_30px_-18px_rgba(0,0,0,0.8)]">
            <Image
              src="/logo.png"
              alt="Serbia Latina"
              width={48}
              height={48}
              className="h-auto w-auto max-h-8 max-w-8 object-contain"
            />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em]">
              <span className="text-blue-700">Serbia</span>{" "}
              <span className="text-red-600">Latina</span>
            </p>
            <h2 className="mt-1 text-[0.95rem] font-semibold leading-snug text-slate-950 sm:text-[1.02rem]">
              {title}
            </h2>
            <p className="mt-1.5 max-w-prose text-[0.82rem] leading-5 text-slate-700">
              Acceso rápido a noticias y comunidad desde la pantalla de inicio.
            </p>
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
            onClick={handleInstall}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-2))] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_10px_22px_-16px_rgba(17,17,17,0.5)] transition hover:-translate-y-0.5"
          >
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/18 text-[10px] leading-none">
              +
            </span>
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
}
