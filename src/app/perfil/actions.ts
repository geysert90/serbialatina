"use server";

import { mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { sendPasswordChangedEmail } from "@/lib/auth/profile-email";
import { updateUserProfile } from "@/lib/auth/profile-store";
import { getSessionUser } from "@/lib/auth/session";
import { authenticateUser, updateWordPressUserPassword } from "@/lib/auth/user-store";
import { composeWhatsappNumber } from "@/lib/auth/whatsapp-countries";

const PASSWORD_MIN_LENGTH = 8;
const MAX_COVER_PHOTO_SIZE = 2 * 1024 * 1024;
const ALLOWED_COVER_PHOTO_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function readTrimmedText(formData: FormData, field: string): string {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function readRawText(formData: FormData, field: string): string {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

function redirectWithStatus(status: "perfil-actualizado" | "password-ok" | "error", message: string): never {
  redirect(`/cuenta?estado=${status}&mensaje=${encodeURIComponent(message)}`);
}

function normalizeWhatsapp(value: string): string {
  return value.replace(/[^+\d\s()-]/g, "").replace(/\s+/g, " ").trim();
}

async function saveCoverPhoto(userId: string, file: File): Promise<string> {
  const extension = ALLOWED_COVER_PHOTO_TYPES.get(file.type);

  if (!extension) {
    throw new Error("La foto de portada debe ser JPG, PNG o WebP.");
  }

  if (file.size > MAX_COVER_PHOTO_SIZE) {
    throw new Error("La foto de portada no debe superar 2 MB.");
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "profile-covers");
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "-");
  const filename = `${safeUserId}-${Date.now()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), bytes);

  return `/uploads/profile-covers/${filename}`;
}

export async function updateProfileAction(formData: FormData): Promise<void> {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect("/acceso");
  }

  const whatsappCountry = readTrimmedText(formData, "whatsappCountry");
  const whatsappLocalNumber = readTrimmedText(formData, "whatsappLocalNumber");
  const whatsapp = composeWhatsappNumber({
    countryCode: whatsappCountry,
    localNumber: whatsappLocalNumber,
    legacyPhone: readTrimmedText(formData, "whatsapp"),
  });
  const coverPhoto = formData.get("coverPhoto");
  let coverPhotoUrl: string | undefined;

  try {
    if (coverPhoto instanceof File && coverPhoto.size > 0) {
      coverPhotoUrl = await saveCoverPhoto(currentUser.id, coverPhoto);
    }

    await updateUserProfile({
      userId: currentUser.id,
      whatsapp,
      whatsappCountry,
      whatsappLocalNumber,
      coverPhotoUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No pudimos actualizar el perfil.";
    redirectWithStatus("error", message);
  }

  revalidatePath("/perfil");
  revalidatePath("/cuenta");
  redirectWithStatus("perfil-actualizado", "Perfil actualizado correctamente.");
}

export async function changePasswordAction(formData: FormData): Promise<void> {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect("/acceso");
  }

  const currentPassword = readRawText(formData, "currentPassword");
  const password = readRawText(formData, "password");
  const confirmPassword = readRawText(formData, "confirmPassword");

  if (!currentPassword) {
    redirectWithStatus("error", "Introduce tu contraseña actual.");
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    redirectWithStatus("error", "La nueva contraseña debe tener al menos 8 caracteres.");
  }

  if (password !== confirmPassword) {
    redirectWithStatus("error", "Las contraseñas nuevas no coinciden.");
  }

  const authResult = await authenticateUser({
    email: currentUser.email,
    password: currentPassword,
  });

  if (!authResult.ok) {
    redirectWithStatus("error", "La contraseña actual no es correcta.");
  }

  try {
    await updateWordPressUserPassword({
      userId: currentUser.id,
      password,
    });

    await sendPasswordChangedEmail({
      user: {
        name: currentUser.name,
        email: currentUser.email,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No pudimos cambiar la contraseña.";
    redirectWithStatus("error", message);
  }

  revalidatePath("/perfil");
  revalidatePath("/cuenta");
  redirectWithStatus(
    "password-ok",
    "Contraseña cambiada. Enviamos la confirmación al correo de la cuenta.",
  );
}
