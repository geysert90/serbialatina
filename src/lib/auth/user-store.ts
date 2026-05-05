import { isEmailVerified } from "@/lib/auth/email-verification";
import { DEFAULT_USER_ROLE, normalizeUserRole, type UserRole } from "@/lib/auth/roles";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

type WordPressUser = {
  id: number;
  name?: string;
  email?: string;
  roles?: string[];
  registered_date?: string;
};

type WordPressError = {
  code?: string;
  message?: string;
};

type WordPressJwtTokenResponse = {
  token?: string;
  user_email?: string;
  user_display_name?: string;
  user_nicename?: string;
};

const WORDPRESS_REQUEST_TIMEOUT_MS = 15_000;

function createRequestSignal(): AbortSignal {
  return AbortSignal.timeout(WORDPRESS_REQUEST_TIMEOUT_MS);
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function getWordPressApiUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL?.trim();

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_WORDPRESS_API_URL is not configured.");
  }

  return apiUrl.replace(/\/$/, "");
}

function getWordPressApiCredentials(): { username: string; password: string } {
  const username = process.env.WORDPRESS_API_USERNAME?.trim();
  const password = process.env.WORDPRESS_API_PASSWORD?.replace(/\s+/g, "");

  if (!username || !password) {
    throw new Error("WordPress API credentials are not configured.");
  }

  return { username, password };
}

function getWordPressAuthHeader(): string {
  const { username, password } = getWordPressApiCredentials();

  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

function toPublicUser(user: WordPressUser, fallbackEmail: string): AuthUser {
  const primaryRole = user.roles?.[0];

  return {
    id: String(user.id),
    name: user.name?.trim() || fallbackEmail,
    email: normalizeEmail(user.email || fallbackEmail),
    role: normalizeUserRole(primaryRole),
    createdAt: user.registered_date || new Date().toISOString(),
  };
}

async function readWordPressError(response: Response): Promise<WordPressError> {
  try {
    return (await response.json()) as WordPressError;
  } catch {
    return {};
  }
}

async function findWordPressUserByEmail(email: string): Promise<AuthUser | null> {
  const normalizedEmail = normalizeEmail(email);
  const params = new URLSearchParams({
    search: normalizedEmail,
    context: "edit",
    per_page: "10",
    _fields: "id,name,email,roles,registered_date",
  });

  const response = await fetch(`${getWordPressApiUrl()}/wp/v2/users?${params}`, {
    headers: {
      Authorization: getWordPressAuthHeader(),
      "User-Agent": "SerbiaLatinaAuth/1.0",
    },
    cache: "no-store",
    signal: createRequestSignal(),
  });

  if (!response.ok) {
    throw new Error("Could not fetch WordPress user.");
  }

  const users = (await response.json()) as WordPressUser[];
  const matchedUser = users.find((user) => normalizeEmail(user.email || "") === normalizedEmail);

  return matchedUser ? toPublicUser(matchedUser, normalizedEmail) : null;
}

function makeUsername(input: { name: string; email: string }, suffix?: number): string {
  const emailPrefix = input.email.split("@")[0] || input.name;
  const base = (emailPrefix || input.name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_\-.]+/g, "-")
    .replace(/^[\-.]+|[\-.]+$/g, "")
    .slice(0, 40);

  const username = base || `usuario-${Date.now()}`;

  return suffix ? `${username}-${suffix}` : username;
}

async function createWordPressUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<
  | {
      ok: true;
      user: AuthUser;
    }
  | {
      ok: false;
      reason: "email_taken";
    }
> {
  const email = normalizeEmail(input.email);
  const existingUser = await findWordPressUserByEmail(email);

  if (existingUser) {
    return {
      ok: false,
      reason: "email_taken",
    };
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const username = makeUsername(input, attempt || undefined);
    const response = await fetch(`${getWordPressApiUrl()}/wp/v2/users`, {
      method: "POST",
      headers: {
        Authorization: getWordPressAuthHeader(),
        "Content-Type": "application/json",
        "User-Agent": "SerbiaLatinaAuth/1.0",
      },
      body: JSON.stringify({
        username,
        email,
        password: input.password,
        name: input.name.trim(),
        roles: [DEFAULT_USER_ROLE],
      }),
      cache: "no-store",
      signal: createRequestSignal(),
    });

    if (response.ok) {
      const user = (await response.json()) as WordPressUser;

      return {
        ok: true,
        user: toPublicUser(user, email),
      };
    }

    const error = await readWordPressError(response);

    if (error.code === "existing_user_email") {
      return {
        ok: false,
        reason: "email_taken",
      };
    }

    if (error.code !== "existing_user_login") {
      throw new Error(error.message || "Could not create WordPress user.");
    }
  }

  throw new Error("Could not generate an available WordPress username.");
}

async function requestWordPressJwtToken(input: {
  email: string;
  password: string;
}): Promise<WordPressJwtTokenResponse | null> {
  const response = await fetch(`${getWordPressApiUrl()}/jwt-auth/v1/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "SerbiaLatinaAuth/1.0",
    },
    body: JSON.stringify({
      username: normalizeEmail(input.email),
      password: input.password,
    }),
    cache: "no-store",
    signal: createRequestSignal(),
  });

  if (!response.ok) {
    return null;
  }

  const token = (await response.json()) as WordPressJwtTokenResponse;

  return token.token ? token : null;
}

async function getWordPressUserFromJwtToken(token: string, fallbackEmail: string): Promise<AuthUser | null> {
  const params = new URLSearchParams({
    context: "edit",
    _fields: "id,name,email,roles,registered_date",
  });

  const response = await fetch(`${getWordPressApiUrl()}/wp/v2/users/me?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "SerbiaLatinaAuth/1.0",
    },
    cache: "no-store",
    signal: createRequestSignal(),
  });

  if (!response.ok) {
    return null;
  }

  const user = (await response.json()) as WordPressUser;

  return toPublicUser(user, fallbackEmail);
}

export async function updateWordPressUserPassword(input: {
  userId: string;
  password: string;
}): Promise<void> {
  const response = await fetch(`${getWordPressApiUrl()}/wp/v2/users/${input.userId}`, {
    method: "POST",
    headers: {
      Authorization: getWordPressAuthHeader(),
      "Content-Type": "application/json",
      "User-Agent": "SerbiaLatinaAuth/1.0",
    },
    body: JSON.stringify({
      password: input.password,
    }),
    cache: "no-store",
    signal: createRequestSignal(),
  });

  if (!response.ok) {
    const error = await readWordPressError(response);
    throw new Error(error.message || "Could not update WordPress user password.");
  }
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<
  | {
      ok: true;
      user: AuthUser;
    }
  | {
      ok: false;
      reason: "email_taken";
    }
> {
  return createWordPressUser(input);
}

export async function authenticateUser(input: {
  email: string;
  password: string;
}): Promise<
  | {
      ok: true;
      user: AuthUser;
    }
  | {
      ok: false;
      reason: "invalid_credentials";
    }
  | {
      ok: false;
      reason: "email_unverified";
    }
> {
  const jwtToken = await requestWordPressJwtToken(input);

  if (!jwtToken?.token) {
    return {
      ok: false,
      reason: "invalid_credentials",
    };
  }

  const user = await getWordPressUserFromJwtToken(jwtToken.token, jwtToken.user_email || input.email);

  if (!user) {
    return {
      ok: false,
      reason: "invalid_credentials",
    };
  }

  if (!(await isEmailVerified(user))) {
    return {
      ok: false,
      reason: "email_unverified",
    };
  }

  return {
    ok: true,
    user,
  };
}
