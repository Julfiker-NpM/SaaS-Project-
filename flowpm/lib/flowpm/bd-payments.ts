/**
 * Optional checkout / payment-page URLs for Bangladesh mobile banking.
 * Point these at your merchant-hosted payment page or gateway redirect until
 * server-side webhooks are implemented.
 */
export function bdBkashCheckoutUrl(): string {
  return typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_BKASH_CHECKOUT_URL?.trim() ?? "") : "";
}

export function bdNagadCheckoutUrl(): string {
  return typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_NAGAD_CHECKOUT_URL?.trim() ?? "") : "";
}
