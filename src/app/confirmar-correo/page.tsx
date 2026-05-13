import { Suspense } from "react";

import Link from "next/link";
import { connection } from "next/server";

import { confirmEmailVerification } from "@/lib/auth/email-verification";

export const metadata = {
  title: "Confirmar correo",
};

type ConfirmEmailPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function ConfirmEmailFallback() {
  return (
    <div className="panel mx-auto w-full max-w-xl p-6 text-center md:p-8">
      <p className="text-sm text-black/58">Confirmando correo...</p>
    </div>
  );
}

async function ConfirmEmailResult({ searchParams }: ConfirmEmailPageProps) {
  await connection();

  const params = await searchParams;
  const token = firstParam(params.token).trim();
  const result = token
    ? await confirmEmailVerification(token)
    : { ok: false as const, reason: "invalid_or_expired" as const };
  const isOk = result.ok;

  return (
    <div className="panel mx-auto w-full max-w-xl p-6 text-center md:p-8">
      <div className="eyebrow mx-auto w-fit">
        {isOk ? "Correo confirmado" : "Enlace invalido"}
      </div>
      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-black md:text-4xl">
        {isOk ? "Tu cuenta ya esta activa" : "No pudimos confirmar tu correo"}
      </h1>
      <p className="mt-4 text-sm leading-7 text-black/62">
        {isOk
          ? "Gracias por confirmar tu direccion. Ya puedes iniciar sesion en Serbia Latina."
          : "El enlace puede haber vencido o ya no es valido. Intenta registrarte de nuevo o pide un nuevo correo de confirmacion."}
      </p>
      <Link
        href="/acceso"
        className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black/92"
      >
        Ir a iniciar sesion
      </Link>
    </div>
  );
}

export default function ConfirmEmailPage({ searchParams }: ConfirmEmailPageProps) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-14rem)] w-full max-w-7xl items-center justify-center px-4 py-10 md:px-8">
      <Suspense fallback={<ConfirmEmailFallback />}>
        <ConfirmEmailResult searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
