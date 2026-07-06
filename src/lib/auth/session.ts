import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { normalizeUserRole, type UserRole } from "@/lib/auth/roles";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type SessionPayload = {
  sub: string;
  name: string;
  email: string;
  role?: UserRole;
  exp: number;
};

const SESSION_COOKIE_NAME = "serbia_latina_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;
const DEFAULT_SESSION_SECRET = "change-me-in-production";

function getSessionSecret(): string {
  return process.env.AUTH_SESSION_SECRET?.trim() || DEFAULT_SESSION_SECRET;
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function encodeSession(payload: SessionPayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

function decodeSession(session: string | undefined): SessionUser | null {
  if (!session) {
    return null;
  }

  const [encodedPayload, signature] = session.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<SessionPayload>;

    if (
      typeof payload.sub !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp < Date.now()
    ) {
      return null;
    }

    return {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: normalizeUserRole(payload.role),
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();

  return decodeSession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function createSession(user: SessionUser): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + SESSION_DURATION_MS;

  cookieStore.set(
    SESSION_COOKIE_NAME,
    encodeSession({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      exp: expiresAt,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(expiresAt),
    },
  );
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE_NAME);
}
