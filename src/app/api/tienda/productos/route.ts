import { NextResponse } from "next/server";
import { getStoreProducts } from "@/lib/store-db";

export async function GET() {
  try {
    const products = await getStoreProducts();
    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json(
      { products: [], error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
