/**
 * Shipping configuration — defaults synced from WooCommerce (admin.segun2idioma.com).
 *
 * The checkout page fetches live values server-side; client components use these defaults
 * which match the real WooCommerce shipping zone "Local".
 */

export type ShippingConfig = {
  /** Free shipping threshold in RSD */
  freeThreshold: number;
  /** Paid shipping cost in RSD (applied when below threshold) */
  shippingCost: number;
  /** Paid shipping method label */
  shippingLabel: string;
  /** Currency code */
  currency: string;
};

/** Default shipping config — matches WooCommerce zone "Local" */
export const DEFAULT_SHIPPING: ShippingConfig = {
  freeThreshold: 5000,    // RSD — free shipping min_amount
  shippingCost: 300,      // RSD — "Envio Express" flat_rate cost
  shippingLabel: "Envio Express",
  currency: "RSD",
};

/**
 * Fetch live shipping config from WooCommerce REST API.
 * Use in server components (page.tsx).
 */
export async function fetchShippingConfig(): Promise<ShippingConfig> {
  const WC_API = "https://admin.segun2idioma.com/wp-json/wc/v3";
  const WC_USER = process.env.WORDPRESS_API_USERNAME || "darkness";
  const WC_PASS = process.env.WORDPRESS_API_PASSWORD || "";

  const config: ShippingConfig = { ...DEFAULT_SHIPPING };

  try {
    const zonesRes = await fetch(`${WC_API}/shipping/zones`, {
      headers: { Authorization: authHeader(WC_USER, WC_PASS) },
      signal: AbortSignal.timeout(8000),
    });
    if (!zonesRes.ok) return config;

    const zones: Array<{ id: number }> = await zonesRes.json();

    for (const zone of zones) {
      if (zone.id === 0) continue;

      const methodsRes = await fetch(
        `${WC_API}/shipping/zones/${zone.id}/methods`,
        { headers: { Authorization: authHeader(WC_USER, WC_PASS) }, signal: AbortSignal.timeout(8000) }
      );
      if (!methodsRes.ok) continue;

      const methods: Array<{
        enabled: boolean;
        method_id: string;
        title: string;
        settings: Record<string, { value: string }>;
      }> = await methodsRes.json();

      for (const m of methods) {
        if (!m.enabled) continue;
        if (m.method_id === "free_shipping" && m.settings?.min_amount?.value) {
          config.freeThreshold = Number(m.settings.min_amount.value) || 5000;
        }
        if (m.method_id === "flat_rate" && m.settings?.cost?.value) {
          config.shippingCost = Number(m.settings.cost.value) || 300;
          config.shippingLabel = m.title || "Envio Express";
        }
      }
      break; // first valid zone only
    }
  } catch {
    // Return defaults on error
  }

  return config;
}

/** Compute shipping progress for the progress bar */
export function getShippingProgress(
  currentTotal: number,
  config: ShippingConfig = DEFAULT_SHIPPING
) {
  const remaining = Math.max(0, config.freeThreshold - currentTotal);
  const percent = Math.min(100, (currentTotal / config.freeThreshold) * 100);
  return {
    current: currentTotal,
    target: config.freeThreshold,
    remaining,
    percent,
    unlocked: remaining === 0,
    shippingCost: config.shippingCost,
    shippingLabel: config.shippingLabel,
    currency: config.currency,
  };
}

function authHeader(user: string, pass: string): string {
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}
