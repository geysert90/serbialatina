import { splitWhatsappNumber } from "@/lib/auth/whatsapp-countries";

export function deriveWhatsappDefaults(phone?: string | null): {
  countryCode: import("@/lib/auth/whatsapp-countries").WhatsappCountryCode;
  localNumber: string;
} {
  return splitWhatsappNumber(phone);
}
