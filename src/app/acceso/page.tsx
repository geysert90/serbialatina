import { Suspense } from "react";

import { redirect } from "next/navigation";
import { connection } from "next/server";

import { AccessFlow } from "@/components/auth/access-flow";
import { getSessionUser } from "@/lib/auth/session";

export const metadata = {
  title: "Acceso",
};

type AccessPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function AccessFallback() {
  return (
    <div
      className="panel w-full max-w-xl p-6 md:p-7"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="mt-1 inline-block size-6 shrink-0 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent"
        />
        <div className="space-y-2">
          <p className="text-sm font-semibold text-black">
            Procesando tu acceso...
          </p>
          <p className="text-sm leading-6 text-black/58">
            Si acabas de crear una cuenta, estamos terminando el registro y el envio de confirmacion. Cuando finalice, revisa tu correo, spam o promociones antes de iniciar sesion.
          </p>
        </div>
      </div>
    </div>
  );
}

async function AccessPanel({ searchParams }: AccessPageProps) {
  await connection();

  const [params, currentUser] = await Promise.all([searchParams, getSessionUser()]);

  if (currentUser) {
    redirect("/cuenta");
  }

  const requestedMode = firstParam(params.modo).trim().toLowerCase();
  const initialMode = requestedMode === "registro" ? "register" : "login";

  return <AccessFlow initialMode={initialMode} />;
}

export default function AccessPage({ searchParams }: AccessPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 md:px-8 md:py-10">
      <section className="flex min-h-[calc(100vh-14rem)] items-start justify-center py-4 md:items-center md:py-10">
        <Suspense fallback={<AccessFallback />}>
          <AccessPanel searchParams={searchParams} />
        </Suspense>
      </section>
    </div>
  );
}
