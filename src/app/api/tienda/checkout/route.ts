import { NextResponse } from "next/server";

const WC_API_BASE = "https://admin.serbialatina.com/wp-json/wc/v3";
const WC_CONSUMER_KEY = "ck_c699ba160c2fd68d9da31ad7329e24ff3e069f16";
const WC_CONSUMER_SECRET = "cs_df4660a82753fc483e50fdbaa4733536c672af9c";

type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  storeUrl: string;
  storeName: string;
};

export async function POST(request: Request) {
  let body: {
    name: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
    items: CartItem[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { name, email, phone, address, notes, items } = body;

  if (!name?.trim() || !email?.trim() || !phone?.trim()) {
    return NextResponse.json(
      { error: "Nombre, email y teléfono son obligatorios" },
      { status: 400 }
    );
  }
  if (!items || items.length === 0) {
    return NextResponse.json(
      { error: "El carrito está vacío" },
      { status: 400 }
    );
  }

  try {
    // Create WooCommerce order
    const lineItems = items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
    }));

    const orderPayload = {
      payment_method: "cod",
      payment_method_title: "Contra reembolso",
      set_paid: false,
      billing: {
        first_name: name.trim().split(" ")[0] || name.trim(),
        last_name: name.trim().split(" ").slice(1).join(" ") || "",
        address_1: (address || "").trim(),
        email: email.trim(),
        phone: phone.trim(),
      },
      shipping: {
        first_name: name.trim().split(" ")[0] || name.trim(),
        last_name: name.trim().split(" ").slice(1).join(" ") || "",
        address_1: (address || "").trim(),
      },
      line_items: lineItems,
      customer_note: (notes || "").trim(),
      meta_data: [
        { key: "_serbialatina_source", value: "nextjs-frontend" },
      ],
    };

    const url = new URL(`${WC_API_BASE}/orders`);
    url.searchParams.set("consumer_key", WC_CONSUMER_KEY);
    url.searchParams.set("consumer_secret", WC_CONSUMER_SECRET);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(`WC order creation failed [${res.status}]:`, errText);
      throw new Error(`Error del servidor de tienda (${res.status})`);
    }

    const order = await res.json();

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderId: `#${order.id}`,
        total: order.total,
        items: items.length,
      },
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Error al procesar el pedido" },
      { status: 500 }
    );
  }
}
