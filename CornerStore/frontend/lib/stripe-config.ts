import { apiClient } from "@/lib/services/api-client";

export type StripeConfigDTO = {
  publishableKey: string | null;
  backendConfigured: boolean;
};

let cachedConfig: StripeConfigDTO | null | undefined;

const PLACEHOLDER_PATTERNS = [/your_key/i, /xxxx/i, /placeholder/i];

function normalizePublishableKey(key: string | null | undefined): string | null {
  const trimmed = key?.trim();
  if (!trimmed || !trimmed.startsWith("pk_")) return null;
  if (PLACEHOLDER_PATTERNS.some((p) => p.test(trimmed))) return null;
  return trimmed;
}

export function getEnvStripePublishableKey(): string | null {
  return normalizePublishableKey(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

/** Loads Stripe publishable key from env or backend (Docker/production fallback). */
export async function loadStripeConfig(force = false): Promise<StripeConfigDTO> {
  const envKey = getEnvStripePublishableKey();
  if (envKey) {
    cachedConfig = { publishableKey: envKey, backendConfigured: true };
    return cachedConfig;
  }

  if (!force && cachedConfig !== undefined) return cachedConfig ?? { publishableKey: null, backendConfigured: false };

  try {
    const cfg = await apiClient<StripeConfigDTO>("/Payments/stripe-config", { skipAuth: true });
    cachedConfig = {
      publishableKey: normalizePublishableKey(cfg.publishableKey),
      backendConfigured: Boolean(cfg.backendConfigured),
    };
  } catch {
    cachedConfig = { publishableKey: null, backendConfigured: false };
  }

  return cachedConfig ?? { publishableKey: null, backendConfigured: false };
}

export function isStripeConfigured(config?: StripeConfigDTO | null): boolean {
  if (config) return Boolean(config.publishableKey && config.backendConfigured);
  return Boolean(getEnvStripePublishableKey());
}
