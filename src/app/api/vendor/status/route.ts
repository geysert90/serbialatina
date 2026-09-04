import { NextResponse } from "next/server";

const SL_API_BASE = "https://admin.serbialatina.com/wp-json/sl/v1";
const SL_API_KEY = "sl_marketplace_2026";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wpUserId = searchParams.get("wp_user_id");

  if (!wpUserId) {
    return NextResponse.json({ error: "wp_user_id required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${SL_API_BASE}/vendor/status/${wpUserId}`, {
      headers: { "X-SL-API-Key": SL_API_KEY },
    });

    if (!res.ok) {
      return NextResponse.json({ status: "none" });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ status: "none", error: "connection error" });
  }
}
