import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { getBaseSiteUrl } from "@/lib/utils";

const GOOGLE_STATE_COOKIE = "serbia_latina_google_state";

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI?.trim() ||
    new URL("/api/auth/google/callback", getBaseSiteUrl()).toString();

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID no está configurado.");
  }

  return { clientId, redirectUri };
}

export async function GET() {
  try {
    const { clientId, redirectUri } = getGoogleConfig();
    const state = randomBytes(24).toString("base64url");

    const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleUrl.searchParams.set("client_id", clientId);
    googleUrl.searchParams.set("redirect_uri", redirectUri);
    googleUrl.searchParams.set("response_type", "code");
    googleUrl.searchParams.set("scope", "openid email profile");
    googleUrl.searchParams.set("state", state);
    googleUrl.searchParams.set("prompt", "select_account");

    const response = NextResponse.redirect(googleUrl);
    response.cookies.set(GOOGLE_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch (error) {
    console.error("[auth/google/start]", error);
    return NextResponse.redirect(new URL("/acceso?error=google_config", getBaseSiteUrl()));
  }
}
