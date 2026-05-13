import { writeFileSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

const DB_NAME = "whatstore";
const DB_USER = "whatstore";
const DB_PASS = "Cj7eAxM2Ni75BM6P";
const DB_HOST = "127.0.0.1";
const STORE_BASE_URL = "https://store.segun2idioma.com";

function mysqlQuery(query: string): string {
  const tmpFile = `${tmpdir()}/hcq-${randomUUID()}.sql`;
  try {
    writeFileSync(tmpFile, query, "utf-8");
    return execSync(
      `mysql -u ${DB_USER} -p${DB_PASS} -h ${DB_HOST} -N -B ${DB_NAME} < ${tmpFile}`,
      { encoding: "utf-8", timeout: 10000 }
    ).trim();
  } finally {
    try { unlinkSync(tmpFile); } catch { /* ok */ }
  }
}

function mysqlInsert(query: string): number {
  const tmpFile = `${tmpdir()}/hci-${randomUUID()}.sql`;
  try {
    writeFileSync(tmpFile, `${query};\nSELECT LAST_INSERT_ID();\n`, "utf-8");
    const out = execSync(
      `mysql -u ${DB_USER} -p${DB_PASS} -h ${DB_HOST} -N -B ${DB_NAME} < ${tmpFile}`,
      { encoding: "utf-8", timeout: 10000 }
    ).trim();
    const lines = out.split("\n").filter(Boolean);
    return Number(lines[lines.length - 1]);
  } finally {
    try { unlinkSync(tmpFile); } catch { /* ok */ }
  }
}

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

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
  let body: { name: string; email: string; phone: string; address: string; notes: string; items: CartItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { name, email, phone, address, items } = body;

  if (!name?.trim() || !email?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: "Nombre, email y teléfono son obligatorios" }, { status: 400 });
  }
  if (!items || items.length === 0) {
    return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
  }

  try {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const ts = Math.floor(Date.now() / 1000);
    const orderIdStr = `#${ts}`;

    let totalPrice = 0;
    const productEntries: Record<string, Record<string, unknown>> = {};
    const productIds: string[] = [];

    for (const item of items) {
      const raw = mysqlQuery(
        `SELECT p.price, p.quantity, p.is_cover, p.downloadable_prodcut, s.id
         FROM products p JOIN stores s ON s.id = p.store_id
         WHERE p.id = ${item.productId} LIMIT 1`
      );

      if (!raw) continue;
      const cols = raw.split("\t");
      const dbPrice = Number(cols[0]) || item.price;
      const dbQty = Number(cols[1]) || 0;
      const isCover = cols[2]?.trim() || "";
      const dl = cols[3]?.trim() || "";

      const image = isCover
        ? `${STORE_BASE_URL}/storage/uploads/is_cover_image/${isCover}`
        : dl
          ? `${STORE_BASE_URL}/storage/uploads/downloadable_prodcut/${dl}`
          : item.imageUrl || "";

      const key = String(ts + productIds.length);
      const subtotal = (dbPrice * item.quantity).toFixed(2);

      productEntries[key] = {
        product_id: item.productId,
        product_name: item.name,
        image,
        quantity: item.quantity,
        price: dbPrice,
        id: String(item.productId),
        downloadable_prodcut: dl,
        tax: [],
        subtotal: "USD" + subtotal,
        originalquantity: dbQty,
        variant_id: 0,
        cover_image: isCover,
        store_id: Number(cols[4]) || 0,
      };

      productIds.push(String(item.productId));
      totalPrice += dbPrice * item.quantity;
    }

    const productJson = JSON.stringify({ products: productEntries });
    const txnId = `TXN-${ts}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const orderId = mysqlInsert(
      `INSERT INTO orders SET
        order_id = '${esc(orderIdStr)}',
        name = '${esc(name.trim())}',
        email = '${esc(email.trim())}',
        phone = '${esc(phone.trim())}',
        user_address_id = '${esc((address || "").trim())}',
        product_id = '${esc(productIds.join(","))}',
        price = ${totalPrice},
        product = '${esc(productJson)}',
        price_currency = 'USD',
        txn_id = '${esc(txnId)}',
        payment_type = 'cod',
        payment_status = 'pending',
        status = 'pending',
        user_id = 0,
        created_by = 0,
        created_at = '${now}',
        updated_at = '${now}'`
    );

    if (!orderId || isNaN(orderId)) {
      throw new Error("No se pudo crear la orden");
    }

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        orderId: orderIdStr,
        total: totalPrice.toFixed(2),
        items: items.length,
      },
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Error al procesar el pedido" }, { status: 500 });
  }
}
