"use client";

import { useMemo, useState } from "react";

import {
  getWhatsappCountry,
  WHATSAPP_COUNTRIES,
  type WhatsappCountryCode,
} from "@/lib/auth/whatsapp-countries";

function countryToOptionLabel(country: (typeof WHATSAPP_COUNTRIES)[number]): string {
  return `${country.flag} ${country.name} (${country.dialCode})`;
}

export function WhatsappPhoneField({
  defaultCountryCode,
  defaultLocalNumber,
}: {
  defaultCountryCode?: WhatsappCountryCode;
  defaultLocalNumber?: string;
}) {
  const initialCountry = getWhatsappCountry(defaultCountryCode) ?? WHATSAPP_COUNTRIES[0];
  const [countryCode, setCountryCode] = useState<WhatsappCountryCode>(initialCountry.code as WhatsappCountryCode);

  const selectedCountry = useMemo(
    () => getWhatsappCountry(countryCode) ?? initialCountry,
    [countryCode, initialCountry],
  );

  return (
    <div className="space-y-2">
      <label
        htmlFor="whatsappCountry"
        className="text-xs font-semibold uppercase tracking-[0.2em] text-black/48"
      >
        Teléfono de WhatsApp
      </label>

      <div className="grid gap-3 md:grid-cols-[220px_1fr]">
        <select
          id="whatsappCountry"
          name="whatsappCountry"
          value={countryCode}
          onChange={(event) => setCountryCode(event.target.value as WhatsappCountryCode)}
          className="w-full rounded-[22px] border border-black/10 bg-white/78 px-4 py-3 text-base text-black outline-none transition focus:border-[rgba(209,91,31,0.45)] focus:ring-4 focus:ring-[rgba(209,91,31,0.12)]"
        >
          {WHATSAPP_COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {countryToOptionLabel(country)}
            </option>
          ))}
        </select>

        <div className="flex overflow-hidden rounded-[22px] border border-black/10 bg-white/78 text-base text-black outline-none transition focus-within:border-[rgba(209,91,31,0.45)] focus-within:ring-4 focus-within:ring-[rgba(209,91,31,0.12)]">
          <span className="flex shrink-0 items-center border-r border-black/8 bg-black/3 px-4 font-semibold text-black/60">
            {selectedCountry.dialCode}
          </span>
          <input
            id="whatsappLocalNumber"
            name="whatsappLocalNumber"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            defaultValue={defaultLocalNumber}
            placeholder="60 123 4567"
            className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none"
          />
        </div>
      </div>

      <p className="text-xs leading-5 text-black/45">
        Elige el país y escribe solo el número local. Nosotros añadimos el prefijo internacional.
      </p>
    </div>
  );
}
