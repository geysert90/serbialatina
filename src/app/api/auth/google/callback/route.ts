import { NextRequest, NextResponse } from "next/server";

import { createSession } from "@/lib/auth/session";
import { authenticateGoogleUser } from "@/lib/auth/user-store";
import { getBaseSiteUrl } from "@/lib/utils";

const GOOGLE_STATE_COOKIE = "serbia_latina_google_state";

type GoogleTokenResponse = {
  access_token?: string;
  id_token?: string;
};

type GoogleUserInfo = {
  email?: string;
  email_verified?: boolean;
  name?: string;
};

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI?.trim() ||
    new URL("/api/auth/google/callback", getBaseSiteUrl()).toString();

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth no configurado.");
  }

  return { clientId, clientSecret, redirectUri };
}

export async function GET(request: NextRequest) {
  const base = getBaseSiteUrl();
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/acceso?error=${encodeURIComponent(reason)}`, base));

  try {
    const { clientId, clientSecret, redirectUri } = getGoogleConfig();
    const url = request.nextUrl;
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const savedState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;

    if (!code || !state || !savedState || state !== savedState) {
      return fail("google_state");
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });

    if (!tokenResponse.ok) {
      return fail("google_token");
    }

    const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!tokenData.access_token) {
      return fail("google_token_missing");
    }

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      cache: "no-store",
    });

    if (!profileResponse.ok) {
      return fail("google_profile");
    }

    const profile = (await profileResponse.json()) as GoogleUserInfo;
    if (!profile.email || profile.email_verified !== true) {
      return fail("google_email_not_verified");
    }

    const auth = await authenticateGoogleUser({
      email: profile.email,
      name: profile.name,
    });

    await createSession({
      id: auth.user.id,
      name: auth.user.name,
      email: auth.user.email,
      role: auth.user.role,
    });

    const okResponse = NextResponse.redirect(new URL("/cuenta", base));
    okResponse.cookies.delete(GOOGLE_STATE_COOKIE);
    return okResponse;
  } catch (error) {
    console.error("[auth/google/callback]", error);
    return fail("google_auth");
  }
}
