"use server";

const SL_API_BASE = "https://admin.serbialatina.com/wp-json/sl/v1";
const SL_API_KEY = "sl_marketplace_2026";

export async function solicitarTienda(
  wpUserId: string,
  storeName: string,
  whatsapp: string,
): Promise<{
  status: "pending" | "approved" | "exists" | "none";
  error?: string;
  appPassword?: string;
}> {
  if (!storeName.trim()) {
    return { status: "none", error: "El nombre de la tienda es obligatorio." };
  }

  try {
    const res = await fetch(`${SL_API_BASE}/vendor/setup-store`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SL-API-Key": SL_API_KEY,
      },
      body: JSON.stringify({
        wp_user_id: parseInt(wpUserId, 10),
        store_name: storeName.trim(),
        whatsapp: whatsapp.trim(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const code = data.code || "";
      if (code === "exists") return { status: "exists" };
      if (code === "pending") return { status: "pending", error: "Ya tenés una solicitud pendiente." };
      return { status: "none", error: data.message || data.code || "Error al enviar la solicitud." };
    }

    return {
      status: data.status === "pending_approval" ? "pending" : (data.status || "pending"),
      appPassword: data.app_password,
    };
  } catch {
    return { status: "none", error: "Error de conexión con el servidor." };
  }
}

export async function obtenerEstadoTienda(
  wpUserId: string,
): Promise<{
  status: "approved" | "pending" | "none";
  storeName?: string;
  appPassword?: string;
}> {
  try {
    const res = await fetch(`${SL_API_BASE}/vendor/status/${wpUserId}`, {
      headers: { "X-SL-API-Key": SL_API_KEY },
    });

    if (!res.ok) return { status: "none" };

    return await res.json();
  } catch {
    return { status: "none" };
  }
}
