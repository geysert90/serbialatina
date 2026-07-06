"use client";

import { useState, useEffect } from "react";

const CITIES: { id: number; name: string; slug: string }[] = [
  { id: 1, name: "Beograd", slug: "beograd" },
  { id: 2, name: "Novi Sad", slug: "novi-sad" },
  { id: 3, name: "Niš", slug: "nis" },
];

interface Rental {
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
}

interface CityData {
  cityName: string;
  slug: string;
  rentals: Rental[];
  error?: string;
  expanded: boolean;
}

const PREVIEW_COUNT = 4;
const FULL_COUNT = 20;

function RentalCard({ rental }: { rental: Rental }) {
  return (
    <article className="story-card group flex w-[calc(50%-0.375rem)] shrink-0 snap-start flex-col gap-2.5 p-3 transition hover:-translate-y-0.5 sm:w-[260px] sm:gap-3 sm:p-4">
      <a
        href={rental.listingUrl}
        target="_blank"
        rel="noreferrer"
        className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black/10"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={rental.imageUrl}
          alt={`${rental.structure} en ${rental.municipality || rental.cityName}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {rental.furnished ? (
          <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-wider text-white backdrop-blur">
            Amueblado
          </span>
        ) : null}
      </a>

      <div className="flex flex-1 flex-col gap-2">
        <p className="line-clamp-1 text-sm font-semibold text-black">
          {rental.structure} en {rental.municipality || rental.cityName}
        </p>
        <p className="line-clamp-1 text-[0.7rem] text-black/40">
          {rental.street}
        </p>

        <div className="mt-auto flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-lg font-bold text-black">€{rental.price}</span>
          <span className="text-[0.7rem] text-black/40">/mes</span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.66rem] text-black/45">
          <span>{rental.size} m²</span>
          <span>≈ €{rental.pricePerM2}/m²</span>
          <span>{rental.bedrooms}</span>
        </div>

        <a
          href={rental.listingUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--color-accent)] hover:underline"
        >
          Ver propiedad ↗
        </a>
      </div>
    </article>
  );
}

function CityGroup({
  city,
  onToggleExpand,
}: {
  city: CityData;
  onToggleExpand: () => void;
}) {
  const visible = city.expanded ? city.rentals : city.rentals.slice(0, PREVIEW_COUNT);

  if (city.error) {
    return (
      <div className="rounded-[28px] border border-[rgba(209,91,31,0.24)] bg-[rgba(209,91,31,0.06)] p-4 text-sm leading-6 text-black/58">
        <span className="font-semibold">{city.cityName}:</span> {city.error}
      </div>
    );
  }

  if (city.rentals.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-black/10 bg-white/35 p-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-black/28">
        {city.cityName} — sin alquileres disponibles
      </div>
    );
  }

  return (
    <div>
      {/* Cabecera de ciudad */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-black/55">
            {city.cityName}
          </h3>
          <span className="text-[0.65rem] text-black/25">
            {city.rentals.length} disponibles
          </span>
        </div>

        <a
          href={`https://cityexpert.rs/izdavanje-nekretnina/${city.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent)] px-3 py-1.5 text-[0.7rem] font-semibold text-white transition hover:bg-black"
        >
          Ver en CityExpert
          <span aria-hidden="true">↗</span>
        </a>
      </div>

      {/* Cards con scroll horizontal */}
      <div className="-mx-1 snap-x overflow-x-auto pb-3 [scrollbar-width:thin]">
        <div className="flex gap-3 px-1">
          {visible.map((rental) => (
            <RentalCard key={rental.id} rental={rental} />
          ))}

          {/* Botón "Ver más" al final del scroll */}
          {!city.expanded && city.rentals.length > PREVIEW_COUNT ? (
            <button
              onClick={onToggleExpand}
              className="flex w-[calc(50%-0.375rem)] shrink-0 snap-start items-center justify-center rounded-2xl border border-dashed border-black/15 bg-white/50 text-sm font-semibold text-black/45 transition hover:border-black/25 hover:text-black/70 sm:w-[140px]"
            >
              Ver más →
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function RentalsSection() {
  const [cities, setCities] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      CITIES.map(async (city) => {
        try {
          const res = await fetch(`/api/rentals?cityId=${city.id}&perPage=${FULL_COUNT}`);
          if (!res.ok) throw new Error(`Error ${res.status}`);
          const data = await res.json();
          return {
            cityName: city.name,
            slug: city.slug,
            rentals: data.rentals ?? [],
            error: data.error,
            expanded: false,
          };
        } catch (err) {
          return {
            cityName: city.name,
            slug: city.slug,
            rentals: [],
            error: err instanceof Error ? err.message : "Error de conexión",
            expanded: false,
          };
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      setCities(results);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function toggleCity(index: number) {
    setCities((prev) =>
      prev.map((c, i) => (i === index ? { ...c, expanded: !c.expanded } : c)),
    );
  }

  const hasAnyRentals = cities.some((c) => c.rentals.length > 0 && !c.error);
  if (!loading && !hasAnyRentals) return null;

  return (
    <section className="panel overflow-hidden p-5 md:p-6">
      <div className="flex flex-col gap-4 border-b border-black/8 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="eyebrow w-fit">Alquileres</span>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-emerald-700">
              CityExpert
            </span>
          </div>
          <h2 className="section-title font-semibold text-black">
            Alquileres en Serbia
          </h2>
        </div>

        <p className="max-w-xl text-sm leading-6 text-black/55">
          Desliza para ver más propiedades en cada ciudad. Alquileres actualizados desde CityExpert.rs.
        </p>
      </div>

      <div className="mt-6 space-y-8">
        {loading
          ? CITIES.map((city) => (
              <div key={city.id}>
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-black/10" />
                  <div className="h-4 w-20 rounded bg-black/8" />
                </div>
                <div className="flex gap-3 overflow-hidden">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex w-[calc(50%-0.375rem)] shrink-0 animate-pulse flex-col gap-2.5 rounded-2xl bg-white p-3 sm:w-[260px] sm:gap-3 sm:p-4"
                    >
                      <div className="aspect-[4/3] w-full rounded-xl bg-black/8" />
                      <div className="h-4 w-3/4 rounded bg-black/8" />
                      <div className="h-3 w-1/2 rounded bg-black/5" />
                      <div className="h-5 w-1/3 rounded bg-black/10" />
                    </div>
                  ))}
                </div>
              </div>
            ))
          : cities.map((city, i) => (
              <CityGroup key={i} city={city} onToggleExpand={() => toggleCity(i)} />
            ))}
      </div>
    </section>
  );
}
