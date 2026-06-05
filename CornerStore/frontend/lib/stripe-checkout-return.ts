/** Query params Stripe adds after redirect-based authentication (3DS, etc.). */
export function readStripeReturnStatus(): "succeeded" | "failed" | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  if (!params.has("payment_intent") && !params.has("redirect_status")) return null;

  const status = params.get("redirect_status");
  if (status === "succeeded") return "succeeded";
  if (status === "failed") return "failed";
  return null;
}

export function clearStripeReturnParams(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  [
    "stripe_return",
    "payment_intent",
    "payment_intent_client_secret",
    "redirect_status",
  ].forEach((key) => url.searchParams.delete(key));
  window.history.replaceState({}, "", `${url.pathname}${url.search}`);
}
