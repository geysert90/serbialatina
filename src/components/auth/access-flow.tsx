"use client";

import { type MouseEvent as ReactMouseEvent, useState } from "react";

import { LoginForm, RegisterForm } from "@/components/auth/auth-forms";

type AccessMode = "login" | "register";

export function AccessFlow({ initialMode = "login" }: { initialMode?: AccessMode }) {
  const [mode, setMode] = useState<AccessMode>(initialMode);

  function switchMode(
    nextMode: AccessMode,
    event: ReactMouseEvent<HTMLAnchorElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();
    setMode(nextMode);
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      {mode === "login" ? <LoginForm compact /> : <RegisterForm compact />}

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
  );
}
