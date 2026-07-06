import Link from "next/link";
import { connection } from "next/server";

import { submitCommentAction } from "@/app/entradas/[slug]/comment-actions";
import { getSessionUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";
import { getPostComments, type WpComment } from "@/lib/wordpress";

type CommentsSearchParams = {
  comentario?: string;
  mensaje?: string;
};

type CommentsSectionProps = {
  commentsOpen: boolean;
  postId: number;
  postSlug: string;
  searchParams?: Promise<CommentsSearchParams>;
};

type CommentNode = WpComment & {
  replies: CommentNode[];
};

function buildCommentTree(comments: WpComment[]): CommentNode[] {
  const nodes = new Map<number, CommentNode>();
  const roots: CommentNode[] = [];

  comments.forEach((comment) => {
    nodes.set(comment.id, { ...comment, replies: [] });
  });

  nodes.forEach((node) => {
    if (node.parent && nodes.has(node.parent)) {
      nodes.get(node.parent)?.replies.push(node);
      return;
    }

    roots.push(node);
  });

  return roots;
}

function CommentForm({
  buttonLabel,
  parentId = 0,
  postId,
  postSlug,
}: {
  buttonLabel: string;
  parentId?: number;
  postId: number;
  postSlug: string;
}) {
  return (
    <form action={submitCommentAction} className="space-y-3">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="slug" value={postSlug} />
      <input type="hidden" name="parentId" value={parentId} />
      <textarea
        name="content"
        rows={parentId ? 3 : 5}
        maxLength={1800}
        required
        placeholder={parentId ? "Escribe tu respuesta..." : "Comparte tu comentario..."}
        className="w-full rounded-[24px] border border-black/10 bg-white/78 px-4 py-3 text-sm leading-7 text-black outline-none transition placeholder:text-black/35 focus:border-[rgba(209,91,31,0.45)] focus:ring-4 focus:ring-[rgba(209,91,31,0.12)]"
      />
      <button
        type="submit"
        className="inline-flex rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--color-accent)]"
      >
        {buttonLabel}
      </button>
    </form>
  );
}

function CommentItem({
  comment,
  currentUserLoggedIn,
  depth = 0,
  postId,
  postSlug,
}: {
  comment: CommentNode;
  currentUserLoggedIn: boolean;
  depth?: number;
  postId: number;
  postSlug: string;
}) {
  return (
    <article
      id={`comment-${comment.id}`}
      className={`rounded-[26px] border border-black/8 bg-white/72 p-5 ${depth ? "ml-4 md:ml-8" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/8 pb-3">
        <div>
          <p className="font-semibold text-black">{comment.author_name || "Usuario"}</p>
          <p className="text-xs uppercase tracking-[0.18em] text-black/42">
            {formatDate(comment.date)}
          </p>
        </div>
        {comment.status && comment.status !== "approved" ? (
          <span className="rounded-full bg-[rgba(209,91,31,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            En revisión
          </span>
        ) : null}
      </div>

      <div
        className="rich-copy mt-4 text-sm leading-7 text-black/72"
        dangerouslySetInnerHTML={{ __html: comment.content.rendered }}
      />

      {currentUserLoggedIn ? (
        <details className="mt-4 rounded-[22px] border border-black/8 bg-white/60 p-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--color-accent)] [&::-webkit-details-marker]:hidden">
            Responder
          </summary>
          <div className="mt-4">
            <CommentForm
              buttonLabel="Publicar respuesta"
              parentId={comment.id}
              postId={postId}
              postSlug={postSlug}
            />
          </div>
        </details>
      ) : null}

      {comment.replies.length > 0 ? (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserLoggedIn={currentUserLoggedIn}
              depth={depth + 1}
              postId={postId}
              postSlug={postSlug}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export async function CommentsSection({
  commentsOpen,
  postId,
  postSlug,
  searchParams,
}: CommentsSectionProps) {
  await connection();

  const [currentUser, comments, params] = await Promise.all([
    getSessionUser(),
    commentsOpen ? getPostComments(postId) : Promise.resolve([]),
    searchParams ?? Promise.resolve({} as CommentsSearchParams),
  ]);
  const commentTree = buildCommentTree(comments);
  const currentUserLoggedIn = Boolean(currentUser);
  const success = params.comentario === "ok";

  return (
    <section id="comentarios" className="panel space-y-6 p-6 md:p-8">
      <div className="space-y-3 border-b border-black/8 pb-5">
        <div className="eyebrow w-fit">Comentarios</div>
        <h2 className="text-3xl font-semibold tracking-[-0.05em] text-black">
          Conversación de la comunidad
        </h2>
      </div>

      {params.mensaje ? (
        <div
          className={`rounded-[24px] border px-5 py-4 text-sm font-medium ${
            success
              ? "border-[rgba(15,118,110,0.18)] bg-[rgba(15,118,110,0.1)] text-teal-800"
              : "border-[rgba(190,18,60,0.18)] bg-[rgba(190,18,60,0.08)] text-rose-800"
          }`}
          role="status"
          aria-live="polite"
        >
          {params.mensaje}
        </div>
      ) : null}

      {!commentsOpen ? (
        <p className="rounded-[24px] border border-black/8 bg-white/68 px-5 py-4 text-sm text-black/62">
          Los comentarios están cerrados para esta publicación.
        </p>
      ) : currentUser ? (
        <div className="rounded-[28px] border border-black/8 bg-white/72 p-5">
          <p className="mb-4 text-sm text-black/58">
            Comentas como <span className="font-semibold text-black">{currentUser.name}</span>.
          </p>
          <CommentForm buttonLabel="Publicar comentario" postId={postId} postSlug={postSlug} />
        </div>
      ) : (
        <div className="rounded-[28px] border border-black/8 bg-white/72 p-5 text-sm leading-7 text-black/62">
          <p>Inicia sesión o crea una cuenta para comentar y responder.</p>
          <Link
            href="/acceso"
            className="mt-4 inline-flex rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--color-accent)]"
          >
            Acceder
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {commentTree.length > 0 ? (
          commentTree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserLoggedIn={currentUserLoggedIn}
              postId={postId}
              postSlug={postSlug}
            />
          ))
        ) : commentsOpen ? (
          <p className="rounded-[24px] border border-dashed border-black/12 px-5 py-6 text-sm text-black/50">
            Sé la primera persona en comentar esta publicación.
          </p>
        ) : null}
      </div>
    </section>
  );
}
