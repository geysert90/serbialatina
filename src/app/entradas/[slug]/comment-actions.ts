"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { sendTransactionalEmail } from "@/lib/auth/profile-email";
import { getSessionUser } from "@/lib/auth/session";
import { stripHtml, toAbsoluteUrl } from "@/lib/utils";
import {
  areCommentsOpen,
  createWordPressComment,
  getCommentById,
  getCommentExcerpt,
  getPostBySlug,
} from "@/lib/wordpress";

const COMMENT_MIN_LENGTH = 2;
const COMMENT_MAX_LENGTH = 1800;

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(formData: FormData, field: string): number {
  const value = readText(formData, field);
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function redirectToPost(slug: string, status: "ok" | "error", message: string): never {
  redirect(
    `/entradas/${slug}?comentario=${status}&mensaje=${encodeURIComponent(message)}#comentarios`,
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function notifyParentCommentAuthor(input: {
  parentId: number;
  postSlug: string;
  postTitle: string;
  replyAuthorName: string;
  replyAuthorEmail: string;
  replyExcerpt: string;
}): Promise<void> {
  const parentComment = await getCommentById(input.parentId);

  if (!parentComment?.author_email) {
    return;
  }

  if (parentComment.author_email.toLowerCase() === input.replyAuthorEmail.toLowerCase()) {
    return;
  }

  const postUrl = toAbsoluteUrl(`/entradas/${input.postSlug}#comment-${input.parentId}`);
  const recipientName = parentComment.author_name || "lector";
  const safePostTitle = escapeHtml(input.postTitle);
  const safeReplyAuthor = escapeHtml(input.replyAuthorName);
  const safeReplyExcerpt = escapeHtml(input.replyExcerpt);
  const safePostUrl = escapeHtml(postUrl);

  await sendTransactionalEmail({
    to: {
      name: recipientName,
      email: parentComment.author_email,
    },
    subject: `Nueva respuesta a tu comentario en ${input.postTitle}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.6; max-width: 620px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 26px; margin: 0 0 16px;">Tienes una nueva respuesta</h1>
        <p>Hola ${escapeHtml(recipientName)},</p>
        <p>${safeReplyAuthor} respondió a tu comentario en <strong>${safePostTitle}</strong>.</p>
        <blockquote style="border-left: 4px solid #d15b1f; margin: 18px 0; padding: 8px 0 8px 16px; color: #555;">${safeReplyExcerpt}</blockquote>
        <p><a href="${safePostUrl}" style="display: inline-block; background: #111; color: #fff; padding: 12px 18px; border-radius: 999px; text-decoration: none;">Ver conversación</a></p>
        <p style="color: #666; font-size: 14px;">Este mensaje se envió porque alguien respondió a tu comentario en Serbia Latina.</p>
      </div>
    `,
    textContent: `Hola ${recipientName},\n\n${input.replyAuthorName} respondió a tu comentario en ${input.postTitle}.\n\n${input.replyExcerpt}\n\nVer conversación: ${postUrl}`,
  });
}

export async function submitCommentAction(formData: FormData): Promise<void> {
  const currentUser = await getSessionUser();
  const slug = readText(formData, "slug");

  if (!slug) {
    redirect("/");
  }

  if (!currentUser) {
    redirect(`/acceso?mensaje=${encodeURIComponent("Inicia sesión para comentar.")}`);
  }

  const content = readText(formData, "content");
  const postId = readNumber(formData, "postId");
  const parentId = readNumber(formData, "parentId");
  const authorId = Number(currentUser.id);

  if (!postId || !Number.isFinite(authorId)) {
    redirectToPost(slug, "error", "No pudimos identificar la publicación o tu cuenta.");
  }

  if (content.length < COMMENT_MIN_LENGTH) {
    redirectToPost(slug, "error", "Escribe un comentario antes de enviarlo.");
  }

  if (content.length > COMMENT_MAX_LENGTH) {
    redirectToPost(slug, "error", "El comentario es demasiado largo.");
  }

  const post = await getPostBySlug(slug);

  if (!post || post.id !== postId || !areCommentsOpen(post)) {
    redirectToPost(slug, "error", "Los comentarios no están disponibles para esta publicación.");
  }

  try {
    const createdComment = await createWordPressComment({
      postId,
      parentId,
      authorId,
      authorName: currentUser.name,
      authorEmail: currentUser.email,
      content,
    });

    if (parentId > 0) {
      notifyParentCommentAuthor({
        parentId,
        postSlug: slug,
        postTitle: stripHtml(post.title.rendered),
        replyAuthorName: currentUser.name,
        replyAuthorEmail: currentUser.email,
        replyExcerpt: getCommentExcerpt(createdComment),
      }).catch((error) => {
        console.warn("Could not send comment reply notification", error);
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "No pudimos publicar el comentario.";
    redirectToPost(slug, "error", message);
  }

  revalidatePath(`/entradas/${slug}`);
  revalidatePath("/cuenta");
  redirectToPost(slug, "ok", "Comentario publicado correctamente.");
}
