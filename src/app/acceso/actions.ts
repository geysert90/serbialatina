"use server";

import { redirect } from "next/navigation";

import { createSession, deleteSession } from "@/lib/auth/session";
import { createEmailVerification } from "@/lib/auth/email-verification";
import { authenticateUser, registerUser } from "@/lib/auth/user-store";

export type AuthActionState = {
  status?: "success" | "error";
  errors?: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
  message?: string;
};

const PASSWORD_MIN_LENGTH = 8;

function describeRegistrationError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Error desconocido durante el registro.";
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readTrimmedText(formData: FormData, field: string): string {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function readRawText(formData: FormData, field: string): string {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

function hasFieldErrors(
  errors: AuthActionState["errors"],
): errors is NonNullable<AuthActionState["errors"]> {
  return Boolean(errors && Object.values(errors).some(Boolean));
}

export async function loginAction(
  _state: AuthActionState | undefined | void,
  formData: FormData,
): Promise<AuthActionState | undefined> {
  const email = readTrimmedText(formData, "email");
  const password = readRawText(formData, "password");
  const errors: NonNullable<AuthActionState["errors"]> = {};

  if (!isValidEmail(email)) {
    errors.email = "Introduce un correo valido.";
  }

  if (!password) {
    errors.password = "Introduce tu contrasena.";
  }

  if (hasFieldErrors(errors)) {
    return { status: "error", errors };
  }

  const result = await authenticateUser({ email, password });

  if (!result.ok) {
    return {
      status: "error",
      message:
        result.reason === "email_unverified"
          ? "Tu correo aun no esta confirmado. Revisa tu bandeja de entrada antes de iniciar sesion."
          : "No encontramos una cuenta con ese correo y contrasena.",
    };
  }

  await createSession({
    id: result.user.id,
    name: result.user.name,
    email: result.user.email,
    role: result.user.role,
  });

  redirect("/cuenta");
}

export async function registerAction(
  _state: AuthActionState | undefined | void,
  formData: FormData,
): Promise<AuthActionState | undefined> {
  const name = readTrimmedText(formData, "name");
  const email = readTrimmedText(formData, "email");
  const password = readRawText(formData, "password");
  const confirmPassword = readRawText(formData, "confirmPassword");
  const errors: NonNullable<AuthActionState["errors"]> = {};

  if (name.length < 2) {
    errors.name = "Escribe un nombre de al menos 2 caracteres.";
  }

  if (!isValidEmail(email)) {
    errors.email = "Introduce un correo valido.";
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = "La contrasena debe tener al menos 8 caracteres.";
  }

  if (confirmPassword !== password) {
    errors.confirmPassword = "Las contrasenas no coinciden.";
  }

  if (hasFieldErrors(errors)) {
    return { status: "error", errors };
  }

  let result: Awaited<ReturnType<typeof registerUser>>;

  try {
    result = await registerUser({ name, email, password });
  } catch (error) {
    console.error("[auth] WordPress registration failed", describeRegistrationError(error));

    return {
      message:
        "No pudimos crear la cuenta en WordPress. Intentalo de nuevo en unos segundos o revisa la configuracion del API de WordPress.",
    };
  }

  if (!result.ok) {
    return {
      status: "error",
      message:
        "Ese correo ya existe en WordPress. No se creo otra cuenta ni se envio confirmacion; inicia sesion o usa otro correo.",
    };
  }

  try {
    await createEmailVerification(result.user);
  } catch (error) {
    console.error("[auth] Verification email failed", describeRegistrationError(error));

    return {
      status: "error",
      message:
        "La cuenta se creo, pero no pudimos enviar el correo de confirmacion. Revisa la configuracion de Brevo antes de iniciar sesion.",
    };
  }

  return {
    status: "success",
    message:
      "Cuenta creada. Te enviamos un correo de confirmacion; abre el enlace antes de iniciar sesion.",
  };
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/");
}
