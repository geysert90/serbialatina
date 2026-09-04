const WC_API_BASE = "https://admin.serbialatina.com/wp-json/wc/v3";
const WC_CONSUMER_KEY = "ck_c699ba160c2fd68d9da31ad7329e24ff3e069f16";
const WC_CONSUMER_SECRET = "cs_df4660a82753fc483e50fdbaa4733536c672af9c";

export type StoreProduct = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  manageStock: boolean;
  stockStatus: string;
  storeId: number;
  storeName: string;
  storeSlug: string;
  imageUrl: string | null;
  description: string | null;
  storeUrl: string;
  permalink: string;
};

export type ProductCategory = {
  id: number;
  name: string;
  slug: string;
};

async function wcFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${WC_API_BASE}${path}`);
  url.searchParams.set("consumer_key", WC_CONSUMER_KEY);
  url.searchParams.set("consumer_secret", WC_CONSUMER_SECRET);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    console.error(`WC API error ${res.status}: ${await res.text().catch(() => "")}`);
    throw new Error(`WC API returned ${res.status}`);
  }

  return res.json();
}

export async function getStoreProducts(): Promise<StoreProduct[]> {
  try {
    const products = await wcFetch<any[]>("/products", {
      per_page: "50",
      status: "publish",
      orderby: "date",
      order: "desc",
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: parseFloat(p.price) || 0,
      quantity: p.manage_stock ? (p.stock_quantity ?? 0) : (p.stock_status === "instock" ? 999 : 0),
      manageStock: p.manage_stock,
      stockStatus: p.stock_status,
      storeId: p.store?.id ?? 0,
      storeName: p.store?.shop_name ?? p.store?.store_name ?? "Tienda",
      storeSlug: p.store?.slug ?? "",
      imageUrl: p.images?.[0]?.src ?? null,
      description: p.short_description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || null,
      storeUrl: p.store?.permalink ?? `https://admin.serbialatina.com/tienda/${p.store?.slug ?? ""}`,
      permalink: p.permalink,
    }));
  } catch (error) {
    console.error("Failed to fetch WooCommerce products:", error);
    return [];
  }
}

export async function getStoreProduct(id: number): Promise<StoreProduct | null> {
  try {
    const p = await wcFetch<any>(`/products/${id}`);

    return {
      id: p.id,
      name: p.name,
      price: parseFloat(p.price) || 0,
      quantity: p.manage_stock ? (p.stock_quantity ?? 0) : (p.stock_status === "instock" ? 999 : 0),
      manageStock: p.manage_stock,
      stockStatus: p.stock_status,
      storeId: p.store?.id ?? 0,
      storeName: p.store?.shop_name ?? p.store?.store_name ?? "Tienda",
      storeSlug: p.store?.slug ?? "",
      imageUrl: p.images?.[0]?.src ?? null,
      description: p.short_description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || null,
      storeUrl: p.store?.permalink ?? `https://admin.serbialatina.com/tienda/${p.store?.slug ?? ""}`,
      permalink: p.permalink,
    };
  } catch (error) {
    console.error("Failed to fetch WooCommerce product:", error);
    return null;
  }
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  try {
    const categories = await wcFetch<any[]>("/products/categories", {
      per_page: "100",
      orderby: "name",
      order: "asc",
    });

    return categories.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    }));
  } catch (error) {
    console.error("Failed to fetch product categories:", error);
    return [];
  }
}

// ─── Store Enrichment ──────────────────────────────────────────
const SL_API_BASE = "https://admin.serbialatina.com/wp-json/sl/v1";

async function enrichWithStoreData(products: StoreProduct[]): Promise<StoreProduct[]> {
  return Promise.all(
    products.map(async (product) => {
      try {
        const res = await fetch(`${SL_API_BASE}/vendor/products/${product.id}`, {
          next: { revalidate: 300 },
        });
        if (!res.ok) return product;
        const sl = await res.json();
        return {
          ...product,
          storeId: sl.store_id ?? product.storeId,
          storeName: sl.store_name ?? product.storeName,
          storeSlug: sl.store_slug ?? product.storeSlug,
        };
      } catch {
        return product;
      }
    })
  );
}

export async function getStoreProductEnriched(id: number): Promise<StoreProduct | null> {
  const product = await getStoreProduct(id);
  if (!product) return null;
  const [enriched] = await enrichWithStoreData([product]);
  return enriched;
}

export async function getStoreProductsEnriched(): Promise<StoreProduct[]> {
  const products = await getStoreProducts();
  return enrichWithStoreData(products);
}
