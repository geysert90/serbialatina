import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import type { AuthUser } from "@/lib/auth/user-store";

type VerificationRecord = {
  userId: string;
  email: string;
  tokenHash: string;
  expiresAt: string;
  verifiedAt?: string;
};

type VerificationStore = {
  records: VerificationRecord[];
};

const VERIFICATION_FILE = path.join(
  process.cwd(),
  ".data",
  "email-verifications.json",
);
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24;
const BREVO_REQUEST_TIMEOUT_MS = 15_000;

function createRequestSignal(): AbortSignal {
  return AbortSignal.timeout(BREVO_REQUEST_TIMEOUT_MS);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

async function readStore(): Promise<VerificationStore> {
  try {
    const content = await fs.readFile(VERIFICATION_FILE, "utf8");
    const parsed = JSON.parse(content) as Partial<VerificationStore>;

    return {
      records: Array.isArray(parsed.records) ? parsed.records : [],
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { records: [] };
    }

    throw error;
  }
}

async function writeStore(store: VerificationStore): Promise<void> {
  await fs.mkdir(path.dirname(VERIFICATION_FILE), { recursive: true });
  await fs.writeFile(VERIFICATION_FILE, `${JSON.stringify(store, null, 2)}\n`);
}

function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

function getBrevoConfig(): {
  apiKey: string;
  senderEmail: string;
  senderName: string;
} {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_FROM_EMAIL?.trim();
  const senderName = process.env.BREVO_FROM_NAME?.trim() || "Serbia Latina";

  if (!apiKey || !senderEmail) {
    throw new Error(
      "Brevo email verification is not configured. Set BREVO_API_KEY and BREVO_FROM_EMAIL.",
    );
  }

  return { apiKey, senderEmail, senderName };
}

async function sendVerificationEmail(input: {
  user: AuthUser;
  verificationUrl: string;
}): Promise<void> {
  const { apiKey, senderEmail, senderName } = getBrevoConfig();
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email: input.user.email,
          name: input.user.name,
        },
      ],
      subject: "Confirma tu correo en Serbia Latina",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.6; max-width: 620px; margin: 0 auto; padding: 24px;">
          <h1 style="font-size: 28px; margin: 0 0 16px;">Confirma tu correo</h1>
          <p>Hola ${input.user.name},</p>
          <p>Gracias por registrarte en Serbia Latina. Para activar tu cuenta, confirma tu dirección de correo con este botón:</p>
          <p style="margin: 28px 0;">
            <a href="${input.verificationUrl}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 14px 22px; border-radius: 999px; font-weight: 700;">
              Confirmar correo
            </a>
          </p>
          <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all;"><a href="${input.verificationUrl}">${input.verificationUrl}</a></p>
          <p style="color: #666; font-size: 14px;">Este enlace vence en 24 horas. Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
        </div>
      `,
      textContent: `Hola ${input.user.name},\n\nConfirma tu correo en Serbia Latina abriendo este enlace:\n${input.verificationUrl}\n\nEl enlace vence en 24 horas.`,
    }),
    cache: "no-store",
    signal: createRequestSignal(),
  });

  if (!response.ok) {
    throw new Error("Brevo could not send the verification email.");
  }
}

export async function createEmailVerification(user: AuthUser): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  const store = await readStore();
  const normalizedEmail = normalizeEmail(user.email);

  store.records = store.records.filter(
    (record) =>
      record.userId !== user.id && normalizeEmail(record.email) !== normalizedEmail,
  );
  store.records.push({
    userId: user.id,
    email: normalizedEmail,
    tokenHash,
    expiresAt,
  });

  await writeStore(store);

  const verificationUrl = `${getSiteUrl()}/confirmar-correo?token=${encodeURIComponent(
    token,
  )}`;

  await sendVerificationEmail({ user, verificationUrl });
}

export async function isEmailVerified(user: Pick<AuthUser, "id" | "email">): Promise<boolean> {
  const store = await readStore();
  const normalizedEmail = normalizeEmail(user.email);
  const records = store.records.filter(
    (record) =>
      record.userId === user.id || normalizeEmail(record.email) === normalizedEmail,
  );

  if (!records.length) {
    return true;
  }

  return records.some((record) => Boolean(record.verifiedAt));
}

export async function confirmEmailVerification(token: string): Promise<
  | { ok: true; email: string }
  | { ok: false; reason: "invalid_or_expired" }
> {
  const tokenHash = hashToken(token);
  const store = await readStore();
  const now = Date.now();
  const record = store.records.find((item) => safeEqual(item.tokenHash, tokenHash));

  if (!record || Date.parse(record.expiresAt) < now) {
    return { ok: false, reason: "invalid_or_expired" };
  }

  record.verifiedAt = new Date().toISOString();
  await writeStore(store);

  return { ok: true, email: record.email };
}
