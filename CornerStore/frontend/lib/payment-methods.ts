export type CheckoutPaymentMethod = "card" | "apple_pay" | "instapay" | "cod";

/** Maps frontend id → API enum value (CheckoutPaymentMethod). */
export const PAYMENT_METHOD_API: Record<CheckoutPaymentMethod, number> = {
  card: 0,
  apple_pay: 1,
  instapay: 2,
  cod: 3,
};

export function usesStripe(method: CheckoutPaymentMethod): boolean {
  return method === "card" || method === "apple_pay";
}

export const PAYMENT_OPTIONS: {
  id: CheckoutPaymentMethod;
  labelKey: "payCard" | "payApplePay" | "payInstaPay" | "payCod";
  descKey: "payCardDesc" | "payApplePayDesc" | "payInstaPayDesc" | "payCodDesc";
}[] = [
  { id: "card", labelKey: "payCard", descKey: "payCardDesc" },
  { id: "apple_pay", labelKey: "payApplePay", descKey: "payApplePayDesc" },
  { id: "instapay", labelKey: "payInstaPay", descKey: "payInstaPayDesc" },
  { id: "cod", labelKey: "payCod", descKey: "payCodDesc" },
];
