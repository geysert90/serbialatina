import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

export const metadata = {
  title: "Mi cuenta",
};

type ProfilePageProps = {
  searchParams: Promise<{
    estado?: string;
    mensaje?: string;
  }>;
};

function ProfileRedirectFallback() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 md:px-8 md:py-10">
      <div className="panel p-6 md:p-8" role="status" aria-live="polite">
        <div className="eyebrow w-fit">Mi cuenta</div>
        <p className="mt-3 text-sm text-black/60">Abriendo tu cuenta...</p>
      </div>
    </div>
  );
}

async function ProfileRedirect({ searchParams }: ProfilePageProps) {
  await connection();

  const params = await searchParams;
  const query = new URLSearchParams();

  if (params.estado) {
    query.set("estado", params.estado);
  }

  if (params.mensaje) {
    query.set("mensaje", params.mensaje);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  redirect(`/cuenta${suffix}`);

  return null;
}

export default function ProfilePage({ searchParams }: ProfilePageProps) {
  return (
    <Suspense fallback={<ProfileRedirectFallback />}>
      <ProfileRedirect searchParams={searchParams} />
    </Suspense>
  );
}
