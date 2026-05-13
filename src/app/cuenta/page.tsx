import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { logoutAction } from "@/app/acceso/actions";
import { changePasswordAction, updateProfileAction } from "@/app/perfil/actions";
import { getUserProfile } from "@/lib/auth/profile-store";
import { getSessionUser } from "@/lib/auth/session";
import { deriveWhatsappDefaults } from "@/lib/auth/whatsapp-defaults";
import { WhatsappPhoneField } from "@/components/profile/whatsapp-phone-field";
import { formatDate, stripHtml } from "@/lib/utils";
import {
  getCommentExcerpt,
  getCommentsByAuthor,
  getPostsByIds,
  getRepliesToComments,
  type WpComment,
} from "@/lib/wordpress";

export const metadata = {
  title: "Mi cuenta",
};

type AccountPageProps = {
  searchParams: Promise<{
    estado?: string;
    mensaje?: string;
  }>;
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function AccountPageFallback() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 md:px-8 md:py-10">
      <div className="panel min-h-[360px] p-6 md:p-8">
        <div className="h-44 rounded-[32px] bg-white/55" />
        <div className="mt-6 h-10 w-64 rounded-full bg-white/60" />
        <div className="mt-4 h-5 w-full max-w-xl rounded-full bg-white/50" />
      </div>
    </div>
  );
}

function StatusMessage({
  estado,
  mensaje,
}: {
  estado?: string;
  mensaje?: string;
}) {
  if (!mensaje) {
    return null;
  }

  const success = estado === "perfil-actualizado" || estado === "password-ok";

  return (
    <div
      className={`rounded-[24px] border px-5 py-4 text-sm font-medium ${
        success
          ? "border-[rgba(15,118,110,0.18)] bg-[rgba(15,118,110,0.1)] text-teal-800"
          : "border-[rgba(190,18,60,0.18)] bg-[rgba(190,18,60,0.08)] text-rose-800"
      }`}
      role="status"
      aria-live="polite"
    >
      {mensaje}
    </div>
  );
}

function CommentHistoryList({
  comments,
  emptyText,
  postLinks,
}: {
  comments: WpComment[];
  emptyText: string;
  postLinks: Map<number, { href: string; title: string }>;
}) {
  if (!comments.length) {
    return (
      <p className="rounded-[24px] border border-dashed border-black/12 px-5 py-6 text-sm text-black/50">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => {
        const post = postLinks.get(comment.post);

        return (
          <article key={comment.id} className="rounded-[24px] border border-black/8 bg-white/72 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/42">
                {formatDate(comment.date)}
              </p>
              {post ? (
                <Link href={`${post.href}#comment-${comment.id}`} className="text-sm font-semibold text-[var(--color-accent)] hover:text-black">
                  Ver hilo
                </Link>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-7 text-black/68">{getCommentExcerpt(comment)}</p>
            {post ? (
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-black/38">
                En {post.title}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

async function AccountContent({ searchParams }: AccountPageProps) {
  await connection();

  const [currentUser, params] = await Promise.all([getSessionUser(), searchParams]);

  if (!currentUser) {
    redirect("/acceso");
  }

  const profile = await getUserProfile(currentUser.id);
  const avatarVersion = profile?.coverPhotoUrl || profile?.updatedAt;
  const avatarUrl = avatarVersion
    ? `/api/profile-photo/${currentUser.id}?v=${encodeURIComponent(avatarVersion)}`
    : undefined;
  const whatsappDefaults = deriveWhatsappDefaults(profile?.whatsapp);
  const authorId = Number(currentUser.id);
  const userComments = Number.isFinite(authorId) ? await getCommentsByAuthor(authorId) : [];
  const repliesToUser = await getRepliesToComments(userComments.map((comment) => comment.id));
  const postIds = Array.from(
    new Set([...userComments, ...repliesToUser].map((comment) => comment.post)),
  );
  const commentPosts = await getPostsByIds(postIds);
  const postLinks = new Map(
    commentPosts.map((post) => [
      post.id,
      {
        href: `/entradas/${post.slug}`,
        title: stripHtml(post.title.rendered),
      },
    ]),
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 md:px-8 md:py-10">
      <section className="panel overflow-hidden p-0">
        <div className="relative min-h-[240px] bg-[linear-gradient(135deg,rgba(209,91,31,0.28),rgba(17,17,17,0.07),rgba(13,148,136,0.22))] md:min-h-[320px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.72),transparent_45%)]" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/46 to-transparent" />
        </div>

        <div className="relative px-6 pb-7 md:px-8 md:pb-8">
          <div className="-mt-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[32px] border-4 border-[rgb(245,239,226)] bg-[rgba(209,91,31,0.16)] text-3xl font-semibold uppercase text-[var(--color-accent)] shadow-[0_22px_50px_-34px_rgba(0,0,0,0.8)]">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={`Foto de perfil de ${currentUser.name}`}
                    fill
                    priority
                    unoptimized
                    className="object-cover object-center"
                    sizes="96px"
                  />
                ) : (
                  getInitials(currentUser.name)
                )}
              </div>
              <div className="pb-1">
                <div className="eyebrow w-fit">Mi cuenta</div>
                <h1 className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-black">
                  {currentUser.name}
                </h1>
                <p className="mt-1 break-all text-sm text-black/58">{currentUser.email}</p>
              </div>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex rounded-full border border-black/10 bg-white/82 px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-white"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </section>

      <StatusMessage estado={params.estado} mensaje={params.mensaje} />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.82fr)]">
        <form action={updateProfileAction} className="panel space-y-6 p-6 md:p-8">
          <div className="space-y-2 border-b border-black/8 pb-5">
            <div className="eyebrow w-fit">Perfil</div>
            <h2 className="text-3xl font-semibold tracking-[-0.05em] text-black">
              Datos de la cuenta
            </h2>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="coverPhoto"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-black/48"
            >
              Foto de perfil
            </label>
            <input
              id="coverPhoto"
              name="coverPhoto"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="w-full rounded-[22px] border border-black/10 bg-white/78 px-4 py-3 text-sm text-black file:mr-4 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            <p className="text-xs leading-5 text-black/45">JPG, PNG o WebP. Máximo 2 MB.</p>
          </div>

          <WhatsappPhoneField
            defaultCountryCode={whatsappDefaults.countryCode}
            defaultLocalNumber={whatsappDefaults.localNumber}
          />

          <button
            type="submit"
            className="inline-flex rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--color-accent)]"
          >
            Guardar cambios
          </button>
        </form>

        <form action={changePasswordAction} className="panel space-y-6 p-6 md:p-8">
          <div className="space-y-2 border-b border-black/8 pb-5">
            <div className="eyebrow w-fit">Seguridad</div>
            <h2 className="text-3xl font-semibold tracking-[-0.05em] text-black">
              Cambiar contraseña
            </h2>
            <p className="text-sm leading-7 text-black/60">
              Después del cambio enviaremos una confirmación al correo de tu cuenta.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="currentPassword" className="text-xs font-semibold uppercase tracking-[0.2em] text-black/48">
              Contraseña actual
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-[22px] border border-black/10 bg-white/78 px-4 py-3 text-base text-black outline-none transition focus:border-[rgba(209,91,31,0.45)] focus:ring-4 focus:ring-[rgba(209,91,31,0.12)]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.2em] text-black/48">
              Nueva contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-[22px] border border-black/10 bg-white/78 px-4 py-3 text-base text-black outline-none transition focus:border-[rgba(209,91,31,0.45)] focus:ring-4 focus:ring-[rgba(209,91,31,0.12)]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-[0.2em] text-black/48">
              Repite la nueva contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-[22px] border border-black/10 bg-white/78 px-4 py-3 text-base text-black outline-none transition focus:border-[rgba(209,91,31,0.45)] focus:ring-4 focus:ring-[rgba(209,91,31,0.12)]"
            />
          </div>

          <button
            type="submit"
            className="inline-flex rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
          >
            Cambiar contraseña
          </button>
        </form>
      </section>

      <section className="panel space-y-6 p-6 md:p-8">
        <div className="space-y-2 border-b border-black/8 pb-5">
          <div className="eyebrow w-fit">Actividad</div>
          <h2 className="text-3xl font-semibold tracking-[-0.05em] text-black">
            Historial de comentarios
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-black/60">
            Aquí puedes volver a tus comentarios y revisar si alguien respondió en una publicación.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold tracking-[-0.04em] text-black">Tus comentarios</h3>
            <CommentHistoryList
              comments={userComments}
              emptyText="Aún no has comentado ninguna publicación."
              postLinks={postLinks}
            />
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold tracking-[-0.04em] text-black">Respuestas recibidas</h3>
            <CommentHistoryList
              comments={repliesToUser}
              emptyText="Todavía no tienes respuestas a tus comentarios."
              postLinks={postLinks}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex rounded-full border border-black/10 bg-white/82 px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-white"
        >
          Ir a la portada
        </Link>
      </div>
    </div>
  );
}

export default function AccountPage({ searchParams }: AccountPageProps) {
  return (
    <Suspense fallback={<AccountPageFallback />}>
      <AccountContent searchParams={searchParams} />
    </Suspense>
  );
}
