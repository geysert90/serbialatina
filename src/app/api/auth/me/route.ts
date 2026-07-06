import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getUserProfile } from "@/lib/auth/profile-store";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const profile = await getUserProfile(user.id);

  // Get WP username via environment credentials
  let wpUsername = "";
  try {
    const creds = btoa(
      `${process.env.WORDPRESS_API_USERNAME}:${process.env.WORDPRESS_API_PASSWORD?.replace(/\s+/g, "")}`
    );
    const wpRes = await fetch(
      `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/users/${user.id}`,
      { headers: { Authorization: `Basic ${creds}` } }
    );
    if (wpRes.ok) {
      const wpUser = await wpRes.json();
      wpUsername = wpUser.slug || "";
    }
  } catch { /* ok */ }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    wpUsername,
    whatsapp: profile?.whatsapp ?? "",
  });
}
