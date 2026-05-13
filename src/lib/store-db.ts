import { execSync } from "node:child_process";

const DB_NAME = "whatstore";
const DB_USER = "whatstore";
const DB_PASS = "Cj7eAxM2Ni75BM6P";
const DB_HOST = "127.0.0.1";

const STORE_BASE_URL = "https://store.segun2idioma.com";
const UPLOADS_BASE = `${STORE_BASE_URL}/storage/uploads`;

export type StoreProduct = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  storeId: number;
  storeName: string;
  storeSlug: string;
  imageUrl: string | null;
  description: string | null;
  storeUrl: string;
};

function mysqlQuery(query: string): string {
  return execSync(
    `mysql -u ${DB_USER} -p${DB_PASS} -h ${DB_HOST} -N -B ${DB_NAME} -e "${query.replace(/"/g, '\\"')}"`,
    { encoding: "utf-8", timeout: 10000 }
  ).trim();
}

function buildImageUrl(isCover: string | null, downloadImage: string | null): string | null {
  const filename = (isCover || downloadImage)?.trim();
  if (!filename) return null;

  if (isCover?.trim()) {
    return `${UPLOADS_BASE}/is_cover_image/${isCover.trim()}`;
  }
  if (downloadImage?.trim()) {
    return `${UPLOADS_BASE}/downloadable_prodcut/${downloadImage.trim()}`;
  }
  return null;
}

export async function getStoreProducts(): Promise<StoreProduct[]> {
  try {
    const raw = mysqlQuery(
      `SELECT p.id, p.name, p.price, p.quantity, p.store_id, p.is_cover, p.downloadable_prodcut, p.description, s.name, s.slug
       FROM products p
       JOIN stores s ON s.id = p.store_id
       WHERE p.product_display = 'on' AND s.is_store_enabled = 1 AND s.is_active = 1
       ORDER BY p.created_at DESC
       LIMIT 50`
    );

    if (!raw) return [];
    return parseProducts(raw);
  } catch (error) {
    console.error("Failed to fetch store products:", error);
    return [];
  }
}

export async function getStoreProduct(id: number): Promise<StoreProduct | null> {
  try {
    const raw = mysqlQuery(
      `SELECT p.id, p.name, p.price, p.quantity, p.store_id, p.is_cover, p.downloadable_prodcut, p.description, s.name, s.slug
       FROM products p
       JOIN stores s ON s.id = p.store_id
       WHERE p.id = ${id} AND p.product_display = 'on' AND s.is_store_enabled = 1 AND s.is_active = 1
       LIMIT 1`
    );

    if (!raw) return null;
    const products = parseProducts(raw);
    return products[0] ?? null;
  } catch (error) {
    console.error("Failed to fetch store product:", error);
    return null;
  }
}

function parseProducts(raw: string): StoreProduct[] {
  return raw.split("\n").map((line) => {
    const cols = line.split("\t");
    return {
      id: Number(cols[0]),
      name: cols[1] ?? "",
      price: Number(cols[2]) || 0,
      quantity: Number(cols[3]) || 0,
      storeId: Number(cols[4]),
      storeName: cols[8] ?? "Tienda",
      storeSlug: cols[9] ?? "",
      imageUrl: buildImageUrl(cols[5] || null, cols[6] || null),
      description: cols[7]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || null,
      storeUrl: `${STORE_BASE_URL}/store/${cols[9]}/product/${cols[0]}`,
    };
  });
}
