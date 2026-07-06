import { NextResponse } from "next/server";
import { getStoreProductsEnriched } from "@/lib/store-db";

export async function GET() {
  try {
    const products = await getStoreProductsEnriched();
    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json(
      { products: [], error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
