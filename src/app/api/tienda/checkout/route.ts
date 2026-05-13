import { execSync } from "node:child_process";
import { NextResponse } from "next/server";

const DB_NAME = "whatstore";
const DB_USER = "whatstore";
const DB_PASS = "Cj7eAxM2Ni75BM6P";
const DB_HOST = "127.0.0.1";

const STORE_BASE_URL = "https://store.segun2idioma.com";

function mysqlExec(query: string): string {
  const cmd = `mysql -u ${DB_USER} -p${DB_PASS} -h ${DB_HOST} -N -B ${DB_NAME} -e "${query.replace(/"/g, '\\"')}"`;
  return execSync(cmd, { encoding: "utf-8", timeout: 10000 }).trim();
}

function mysqlInsert(query: string): number {
  const cmd = `mysql -u ${DB_USER} -p${DB_PASS} -h ${DB_HOST} -N -B ${DB_NAME} -e "${query.replace(/"/g, '\\"')}; SELECT LAST_INSERT_ID();"`;
  const out = execSync(cmd, { encoding: "utf-8", timeout: 10000 }).trim();
  const lines = out.split("\n").filter(Boolean);
  return Number(lines[lines.length - 1]);
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

type CheckoutBody = {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  items: CartItem[];
};

export async function POST(request: Request) {
  let body: CheckoutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { name, email, phone, address, notes, items } = body;

  // Validate
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
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const orderTimestamp = Math.floor(Date.now() / 1000);
    const orderIdStr = `#${orderTimestamp}`;

    // Get product details and build order JSON
    let totalPrice = 0;
    const productEntries: Record<string, Record<string, unknown>> = {};
    const productIds: string[] = [];
    let coverImage = "";
    let firstProductName = "";

    for (const item of items) {
      const raw = mysqlExec(
        `SELECT p.price, p.quantity, p.is_cover, p.downloadable_prodcut, s.id as store_id
         FROM products p
         JOIN stores s ON s.id = p.store_id
         WHERE p.id = ${item.productId}
         LIMIT 1`
      );

      if (!raw) continue;

      const cols = raw.split("\t");
      const dbPrice = Number(cols[0]) || item.price;
      const dbQuantity = Number(cols[1]) || 0;
      const isCover = cols[2]?.trim() || "";
      const downloadable = cols[3]?.trim() || "";
      const storeId = Number(cols[4]) || 0;

      const image = isCover
        ? `${STORE_BASE_URL}/storage/uploads/is_cover_image/${isCover}`
        : downloadable
          ? `${STORE_BASE_URL}/storage/uploads/downloadable_prodcut/${downloadable}`
          : item.imageUrl || "";

      if (!coverImage) {
        coverImage = isCover;
        firstProductName = item.name;
      }

      const key = String(Date.now() + productIds.length);
      const subtotal = (dbPrice * item.quantity).toFixed(2);

      productEntries[key] = {
        product_id: item.productId,
        product_name: item.name,
        image,
        quantity: item.quantity,
        price: dbPrice,
        id: String(item.productId),
        downloadable_prodcut: downloadable,
        tax: [],
        subtotal: `USD${subtotal}`,
        originalquantity: dbQuantity,
        variant_id: 0,
        cover_image: isCover,
        store_id: storeId,
      };

      productIds.push(String(item.productId));
      totalPrice += dbPrice * item.quantity;
    }

    const productJson = JSON.stringify({ products: productEntries });
    const txnId = `TXN-${orderTimestamp}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Insert order
    const orderId = mysqlInsert(
      `INSERT INTO orders SET
        order_id = '${orderIdStr}',
        name = '${escapeSql(name.trim())}',
        email = '${escapeSql(email.trim())}',
        phone = '${escapeSql(phone.trim())}',
        user_address_id = '${escapeSql(address?.trim() || "")}',
        product_id = '${escapeSql(productIds.join(","))}',
        price = ${totalPrice},
        product = '${escapeSql(productJson)}',
        price_currency = 'USD',
        txn_id = '${txnId}',
        payment_type = 'cod',
        payment_status = 'pending',
        status = 'pending',
        phone = '${escapeSql(phone.trim())}',
        user_id = 0,
        created_by = 0,
        created_at = '${now}',
        updated_at = '${now}'`
    );

    if (!orderId || isNaN(orderId)) {
      throw new Error("Failed to create order");
    }

    // Also create customer record if needed
    // Check if customer with this email exists
    const existingCustomer = mysqlExec(
      `SELECT id FROM customers WHERE email = '${escapeSql(email.trim().toLowerCase())}' LIMIT 1`
    );

    if (existingCustomer) {
      const customerId = Number(existingCustomer);
      // Link customer to order
      mysqlExec(
        `UPDATE orders SET customer_id = '${customerId}' WHERE id = ${orderId}`
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        orderId: orderIdStr,
        total: totalPrice.toFixed(2),
        items: items.length,
        createdAt: now,
      },
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Error al procesar el pedido. Intenta de nuevo." },
      { status: 500 }
    );
  }
}

function escapeSql(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, '\\"');
}
