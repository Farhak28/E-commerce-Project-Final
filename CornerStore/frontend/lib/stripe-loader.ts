import type { Stripe } from "@stripe/stripe-js";
import { loadStripeConfig } from "@/lib/stripe-config";

const stripePromises = new Map<string, Promise<Stripe | null>>();

/** Loads Stripe.js with the resolved publishable key. */
export async function getStripePromise(): Promise<Stripe | null> {
  const config = await loadStripeConfig(true);
  if (!config.publishableKey) return null;

  let promise = stripePromises.get(config.publishableKey);
  if (!promise) {
    promise = import("@stripe/stripe-js")
      .then(({ loadStripe }) => loadStripe(config.publishableKey!))
      .catch((err) => {
        console.error("Failed to load Stripe.js:", err);
        stripePromises.delete(config.publishableKey!);
        return null;
      });
    stripePromises.set(config.publishableKey, promise);
  }
  return promise;
}
