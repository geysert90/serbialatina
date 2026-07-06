/**
 * CityExpert.rs — API interna para obtener alquileres en Serbia.
 * La API no está documentada públicamente pero es accesible.
 *
 * Ciudades disponibles (rentOrSale="r"):
 *   cityId=1 → Beograd
 *   cityId=2 → Novi Sad
 *   cityId=3 → Niš
 *
 * Las imágenes se sirven desde:
 *   https://img.cityexpert.rs/properties/{size}/{folder}/{propId}/slike/{coverPhoto}@avif
 * donde folder = Math.floor(propId / 1000) * 1000
 */

const CITYEXPERT_API = "https://cityexpert.rs/api/Search";

interface CityExpertRawItem {
  uniqueID: string;
  propId: number;
  cityId: number;
  location: string;
  street: string;
  floor: string;
  size: number;
  structure: string;
  municipality: string;
  polygons: string[];
  ptId: number;
  price: number;
  coverPhoto: string;
  rentOrSale: string;
  caseId: number;
  caseType: string;
  furnished: number; // 0 = unfurnished, 1 = furnished
  furnishingArray: string[];
  bldgOptsArray: string[];
  heatingArray: number[];
  parkingArray: number[];
  yearOfConstruction: number;
  petsArray: string[];
  availableFrom: string;
  firstPublished: string;
  pricePerSize: number;
  bedroomsArray: string[];
  bathroomArray: string[];
}

interface CityExpertSearchResponse {
  result: CityExpertRawItem[];
}

export interface CityExpertRental {
  id: string;
  propId: number;
  cityId: number;
  cityName: string;
  street: string;
  municipality: string;
  price: number;
  size: number;
  pricePerM2: number;
  floor: string;
  structure: string;
  furnished: boolean;
  bedrooms: string;
  imageUrl: string;
  listingUrl: string;
  citySearchUrl: string;
  firstPublished: string;
  availableFrom: string;
}

const CITY_NAMES: Record<number, string> = {
  1: "Beograd",
  2: "Novi Sad",
  3: "Niš",
};

const CITY_SLUGS: Record<number, string> = {
  1: "beograd",
  2: "novi-sad",
  3: "nis",
};

function buildImageUrl(propId: number, coverPhoto: string): string {
  const folder = Math.floor(propId / 1000) * 1000;
  return `https://img.cityexpert.rs/properties/470x/${folder}/${propId}/slike/${coverPhoto}@avif`;
}

function buildCitySearchUrl(cityId: number): string {
  const citySlug = CITY_SLUGS[cityId] ?? "beograd";
  return `https://cityexpert.rs/izdavanje-nekretnina/${citySlug}`;
}

/**
 * Construye una URL directa a una propiedad específica.
 * CityExpert solo usa el cityId y propId para resolver; el slug es decorativo.
 * Patrón: /izdavanje-nekretnina/{city}/{propId}/{slug}
 */
function buildListingUrl(cityId: number, propId: number, street: string, municipality: string): string {
  const citySlug = CITY_SLUGS[cityId] ?? "beograd";
  const raw = [street, municipality].filter(Boolean).join("-");
  // Transliterar caracteres serbios → ASCII
  const slug = raw
    .replace(/Đ/g, "Dj").replace(/đ/g, "dj")
    .replace(/Č/g, "C").replace(/č/g, "c")
    .replace(/Ć/g, "C").replace(/ć/g, "c")
    .replace(/Š/g, "S").replace(/š/g, "s")
    .replace(/Ž/g, "Z").replace(/ž/g, "z")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase() || "property";
  return `https://cityexpert.rs/izdavanje-nekretnina/${citySlug}/${propId}/${slug}`;
}

const STRUCTURE_LABELS: Record<string, string> = {
  "1.0": "Apartamento",
  "1.5": "Penthouse",
  "2.0": "Estudio",
  "3.0": "Loft",
  "4.0": "Casa",
};

function formatStructure(code: string): string {
  return STRUCTURE_LABELS[code] ?? "Propiedad";
}

function formatBedrooms(arr: string[]): string {
  const count = arr.length;
  if (count === 0) return "—";
  if (count === 1) return "1 habitación";
  return `${count} habitaciones`;
}

function mapRental(raw: CityExpertRawItem): CityExpertRental {
  return {
    id: raw.uniqueID,
    propId: raw.propId,
    cityId: raw.cityId,
    cityName: CITY_NAMES[raw.cityId] ?? "Serbia",
    street: raw.street || "Consultar",
    municipality: raw.municipality || "",
    price: raw.price,
    size: raw.size,
    pricePerM2: Math.round(raw.pricePerSize),
    floor: raw.floor ? raw.floor.replace("_", " de ") : "—",
    structure: formatStructure(raw.structure),
    furnished: raw.furnished === 1,
    bedrooms: formatBedrooms(raw.bedroomsArray ?? []),
    imageUrl: buildImageUrl(raw.propId, raw.coverPhoto),
    listingUrl: buildListingUrl(raw.cityId, raw.propId, raw.street, raw.municipality),
    citySearchUrl: buildCitySearchUrl(raw.cityId),
    firstPublished: raw.firstPublished,
    availableFrom: raw.availableFrom,
  };
}

export interface CityExpertSearchParams {
  cityId?: number;
  perPage?: number;
  sort?: "datedsc" | "pricedsc" | "size";
}

const DEFAULT_PER_PAGE = 12;

export async function searchRentals(
  params: CityExpertSearchParams = {},
): Promise<{ rentals: CityExpertRental[]; error?: string }> {
  const { cityId = 1, perPage = DEFAULT_PER_PAGE, sort = "datedsc" } = params;

  const req = JSON.stringify({
    cityId,
    rentOrSale: "r",
    searchSource: "regular",
    sort,
  });

  const url = `${CITYEXPERT_API}?req=${encodeURIComponent(req)}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }, // revalidar cada hora
    });

    if (!response.ok) {
      return {
        rentals: [],
        error: `CityExpert respondió con estado ${response.status}`,
      };
    }

    const data: CityExpertSearchResponse = await response.json();
    const rentals = (data.result ?? []).slice(0, perPage).map(mapRental);

    return { rentals };
  } catch (err) {
    return {
      rentals: [],
      error:
        err instanceof Error ? err.message : "Error desconocido al consultar CityExpert",
    };
  }
}

/**
 * Busca alquileres para múltiples ciudades.
 * Cada ciudad usa su propia llamada.
 */
export async function searchRentalsByCities(
  cityIds: number[] = [1, 2, 3],
  perPage: number = 4,
): Promise<{ cityId: number; cityName: string; rentals: CityExpertRental[]; error?: string }[]> {
  const results = await Promise.all(
    cityIds.map(async (cityId) => {
      const { rentals, error } = await searchRentals({ cityId, perPage, sort: "datedsc" });
      return {
        cityId,
        cityName: CITY_NAMES[cityId] ?? `Ciudad ${cityId}`,
        rentals,
        error,
      };
    }),
  );

  return results;
}
