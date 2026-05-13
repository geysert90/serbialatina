/**
 * Free shipping configuration.
 *
 * The threshold (in USD) above which shipping is free.
 * Set via FREE_SHIPPING_THRESHOLD env var — defaults to $50.
 */
export const FREE_SHIPPING_THRESHOLD =
  Number(process.env.FREE_SHIPPING_THRESHOLD) || 50;

export function getShippingProgress(currentTotal: number): {
  /** Current cart total */
  current: number;
  /** Target to reach for free shipping */
  target: number;
  /** How much more the user needs to spend */
  remaining: number;
  /** Progress percentage (0-100) */
  percent: number;
  /** Whether free shipping is unlocked */
  unlocked: boolean;
} {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - currentTotal);
  const percent = Math.min(100, (currentTotal / FREE_SHIPPING_THRESHOLD) * 100);
  return {
    current: currentTotal,
    target: FREE_SHIPPING_THRESHOLD,
    remaining,
    percent,
    unlocked: remaining === 0,
  };
}
