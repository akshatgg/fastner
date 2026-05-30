/** Shared display formatters. */

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

/** Format a rupee amount, e.g. 12.5 -> "₹12.50". Returns a dash for
 *  null/undefined so callers can render "no price set" uniformly. */
export function formatPrice(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return inr.format(amount);
}
