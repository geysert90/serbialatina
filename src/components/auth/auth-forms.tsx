"use client";

import { useActionState } from "react";

import {
  loginAction,
  registerAction,
  type AuthActionState,
} from "@/app/acceso/actions";

function FieldError({ error }: { error?: string }) {
  if (!error) {
    return null;
  }

  return <p className="text-sm text-[var(--color-accent)]">{error}</p>;
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

function FormMessage({ state }: { state: AuthActionState | undefined }) {
  if (!state?.message) {
    return null;
  }

  const isSuccess = state.status === "success";

  return (
    <div
      className={
        isSuccess
          ? "rounded-[24px] border border-emerald-500/25 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-950 shadow-[0_18px_45px_-32px_rgba(16,185,129,0.75)]"
          : "rounded-[22px] border border-[rgba(209,91,31,0.16)] bg-[rgba(209,91,31,0.08)] px-4 py-3 text-sm text-black/72"
      }
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {isSuccess ? (
          <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
            ✓
          </span>
        ) : null}
        <div className="space-y-1">
          <p className={isSuccess ? "font-semibold" : ""}>{state.message}</p>
          {isSuccess ? (
            <p className="text-xs leading-5 text-emerald-900/72">
              Revisa la bandeja de entrada, spam o promociones. Despues de confirmar el correo, vuelve aqui e inicia sesion.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RegisterPendingNotice() {
  return (
    <div
      className="rounded-[24px] border border-[rgba(209,91,31,0.18)] bg-white/78 px-4 py-4 text-sm text-black/72 shadow-[0_18px_45px_-34px_rgba(209,91,31,0.7)]"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[rgba(209,91,31,0.12)] text-[var(--color-accent)]">
          <Spinner />
        </span>
        <div className="space-y-1">
          <p className="font-semibold text-black">Creando tu cuenta y enviando la confirmacion...</p>
          <p className="text-xs leading-5 text-black/58">
            Esto puede tardar unos segundos. Cuando termine, revisa tu correo para activar la cuenta antes de iniciar sesion.
          </p>
        </div>
      </div>
    </div>
  );
}

const inputClasses =
  "w-full rounded-[20px] border border-black/10 bg-white/88 px-4 py-3 text-sm text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[rgba(209,91,31,0.12)]";

export function LoginForm({ compact = false }: { compact?: boolean }) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <section className={compact ? "rounded-[30px] border border-black/8 bg-white/62 p-4 md:p-5" : "panel h-full p-6 md:p-7"}>
      {compact ? null : (
        <div className="space-y-2 border-b border-black/8 pb-5">
          <div className="eyebrow w-fit">Iniciar sesion</div>
          <h2 className="text-2xl font-semibold tracking-[-0.05em] text-black">
            Entra a tu cuenta
          </h2>
        </div>
      )}

      <form action={formAction} className={compact ? "space-y-3" : "mt-6 space-y-5"}>
        <div className="space-y-2">
          <label
            htmlFor="login-email"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-black/48"
          >
            Correo
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nombre@ejemplo.com"
            className={inputClasses}
          />
          <FieldError error={state?.errors?.email} />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="login-password"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-black/48"
          >
            Contrasena
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Tu contrasena"
            className={inputClasses}
          />
          <FieldError error={state?.errors?.password} />
        </div>

        <FormMessage state={state} />

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(0,0,0,0.75)] transition hover:-translate-y-0.5 hover:bg-black/92 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-black/45"
        >
          {pending ? "Entrando..." : "Iniciar sesion"}
        </button>
      </form>
    </section>
  );
}

export function RegisterForm({ compact = false }: { compact?: boolean }) {
  const [state, formAction, pending] = useActionState(registerAction, undefined);

  return (
    <section className={compact ? "rounded-[30px] border border-black/8 bg-white/62 p-4 md:p-5" : "panel h-full p-6 md:p-7"}>
      {compact ? null : (
        <div className="space-y-2 border-b border-black/8 pb-5">
          <div className="eyebrow w-fit">Registro</div>
          <h2 className="text-2xl font-semibold tracking-[-0.05em] text-black">
            Crea tu cuenta
          </h2>
        </div>
      )}

      <form action={formAction} className={compact ? "space-y-3" : "mt-6 space-y-5"}>
        <div className="space-y-2">
          <label
            htmlFor="register-name"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-black/48"
          >
            Nombre
          </label>
          <input
            id="register-name"
            name="name"
            autoComplete="name"
            placeholder="Tu nombre"
            className={inputClasses}
          />
          <FieldError error={state?.errors?.name} />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="register-email"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-black/48"
          >
            Correo
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nombre@ejemplo.com"
            className={inputClasses}
          />
          <FieldError error={state?.errors?.email} />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="register-password"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-black/48"
          >
            Contrasena
          </label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimo 8 caracteres"
            className={inputClasses}
          />
          <FieldError error={state?.errors?.password} />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="register-confirm-password"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-black/48"
          >
            Repite la contrasena
          </label>
          <input
            id="register-confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repite tu contrasena"
            className={inputClasses}
          />
          <FieldError error={state?.errors?.confirmPassword} />
        </div>

        {pending ? <RegisterPendingNotice /> : <FormMessage state={state} />}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(209,91,31,0.8)] transition hover:-translate-y-0.5 hover:bg-[#bf4f16] disabled:translate-y-0 disabled:cursor-wait disabled:bg-[rgba(209,91,31,0.45)]"
        >
          {pending ? (
            <>
              <Spinner />
              Enviando confirmacion...
            </>
          ) : (
            "Crear cuenta"
          )}
        </button>
      </form>
    </section>
  );
}
