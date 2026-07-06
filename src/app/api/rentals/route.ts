import { NextResponse } from "next/server";

import { searchRentals, type CityExpertSearchParams } from "@/lib/cityexpert";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityId = Number(searchParams.get("cityId")) || 1;
  const perPage = Number(searchParams.get("perPage")) || 20;
  const sort = (searchParams.get("sort") as CityExpertSearchParams["sort"]) || "datedsc";

  try {
    const { rentals, error } = await searchRentals({ cityId, perPage, sort });
    return NextResponse.json({ rentals, error });
  } catch (err) {
    return NextResponse.json({
      rentals: [],
      error: err instanceof Error ? err.message : "Error al consultar CityExpert",
    });
  }
}
