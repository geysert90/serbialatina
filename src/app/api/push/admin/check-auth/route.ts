import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (user.role !== "administrator") {
    return NextResponse.json({ error: "No autorizado. Solo administradores." }, { status: 403 });
  }

  return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
}
