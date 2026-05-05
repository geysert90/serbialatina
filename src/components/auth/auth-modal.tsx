"use client";

import { type MouseEvent as ReactMouseEvent, useState } from "react";
import { createPortal } from "react-dom";

import { LoginForm, RegisterForm } from "@/components/auth/auth-forms";

type AuthModalMode = "login" | "register";

export function AuthModalButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthModalMode>("login");

  function openModal(nextMode: AuthModalMode) {
    setMode(nextMode);
    setIsOpen(true);
  }

  function handleAccessClick(
    event: ReactMouseEvent<HTMLAnchorElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();
    openModal("login");
  }

  function handleOverlayClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      setIsOpen(false);
    }
  }

  function switchMode(
    nextMode: AuthModalMode,
    event: ReactMouseEvent<HTMLAnchorElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();
    setMode(nextMode);
  }

  const modalTitle = mode === "login" ? "Iniciar sesión" : "Crear cuenta";

  return (
    <>
      <a
        href="/acceso"
        onClick={handleAccessClick}
        className="inline-flex items-center gap-3 rounded-full border border-black/10 bg-white/76 px-2 py-2 text-black shadow-[0_12px_30px_-22px_rgba(0,0,0,0.7)] transition hover:-translate-y-0.5 hover:bg-white"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-black/8 bg-[rgba(209,91,31,0.1)] text-[var(--color-accent)]">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21a7 7 0 0 0-14 0" />
            <circle cx="12" cy="8" r="4" />
          </svg>
        </span>
        <span className="hidden pr-2 text-left sm:block">
          <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-black/40">
            Usuarios
          </span>
          <span className="block max-w-[9rem] truncate text-sm font-semibold text-black">
            Acceder
          </span>
        </span>
      </a>

      {isOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/45 px-4 py-6 backdrop-blur-sm md:items-center md:py-10"
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-modal-title"
              onClick={handleOverlayClick}
            >
              <div
                className="panel relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto p-4 shadow-[0_28px_80px_-36px_rgba(0,0,0,0.9)] md:max-h-[calc(100vh-5rem)] md:p-5"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-4 border-b border-black/8 pb-4">
                  <h2
                    id="auth-modal-title"
                    className="text-2xl font-semibold tracking-[-0.05em] text-black md:text-3xl"
                  >
                    {modalTitle}
                  </h2>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/80 text-xl leading-none text-black/65 transition hover:bg-white hover:text-black"
                    aria-label="Cerrar modal"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-5">
                  {mode === "login" ? <LoginForm compact /> : <RegisterForm compact />}
                </div>

                {mode === "login" ? (
                  <div className="mt-4 rounded-[24px] border border-black/8 bg-white/62 p-4 text-center">
                    <p className="text-sm text-black/58">¿No tienes cuenta?</p>
                    <a
                      href="/acceso?modo=registro"
                      onClick={(event) => switchMode("register", event)}
                      className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-[rgba(209,91,31,0.24)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-accent)] transition hover:-translate-y-0.5 hover:bg-[rgba(209,91,31,0.08)]"
                    >
                      Crear cuenta
                    </a>
                  </div>
                ) : (
                  <div className="mt-4 rounded-[24px] border border-black/8 bg-white/62 p-4 text-center">
                    <p className="text-sm text-black/58">¿Ya tienes cuenta?</p>
                    <a
                      href="/acceso"
                      onClick={(event) => switchMode("login", event)}
                      className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-white/88"
                    >
                      Iniciar sesión
                    </a>
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
