import { getProducts } from "@/lib/services/products";
import { getOrders } from "@/lib/services/orders";
import {
  getPersonalizedProducts,
  getPersonalizedProductsGuest,
  getProductsByBudget,
  getProductsByCategory,
  getTrendingProducts,
} from "@/lib/services/recommendations";
import { mapProductDTO } from "@/lib/utils/product";
import type { Product } from "@/lib/types";
import type { AssistantStructuredData } from "@/lib/types/assistant";
import type { VisualProductAttributes, VisualProductMatch } from "@/lib/types/visual-search";
import { matchPolicyIntent } from "@/lib/chatbot/policies";

export type AssistantMessage = {
  role: "user" | "assistant";
  text: string;
  products?: Product[];
  structured?: AssistantStructuredData | null;
  imagePreview?: string | null;
  visualSearch?: {
    exactMatchFound: boolean;
    attributes: VisualProductAttributes;
    exactMatches: VisualProductMatch[];
    similarProducts: VisualProductMatch[];
    alternatives: VisualProductMatch[];
  } | null;
};

export type AssistantIntent =
  | "search"
  | "budget"
  | "recommend"
  | "compare"
  | "policy"
  | "order"
  | "trending"
  | "category";

const CATEGORY_ALIASES: { pattern: RegExp; term: string }[] = [
  { pattern: /\b(smart\s*phone|smartphone|mobile|iphone|android|phone|phones)\b/i, term: "Smartphones" },
  { pattern: /\b(laptops?|notebook|macbooks?)\b/i, term: "Laptops" },
  { pattern: /\b(gaming|gamer|console|playstation|xbox|nintendo)\b/i, term: "Gaming" },
  { pattern: /\b(headphone|earbud|earphone|audio|speaker)\b/i, term: "Audio" },
  { pattern: /\b(smart\s*watch|wearable|fitness\s*band)\b/i, term: "Smart Watches" },
  { pattern: /\b(accessor(y|ies)|case|charger|cable)\b/i, term: "Accessories" },
];

export type AssistantQueryOptions = {
  isSignedIn: boolean;
  compareIds?: number[];
  cartProductIds?: number[];
  recentProductIds?: number[];
};

export function parseIntent(query: string): {
  intent: AssistantIntent;
  budget?: number;
  category?: string;
  orderId?: string;
  currencyNote?: string;
} {
  const q = query.trim();
  const lower = q.toLowerCase();

  if (/where is my order|track order|order status|my order|latest order/.test(lower)) {
    const idMatch = q.match(/[0-9a-f-]{8,}/i);
    return { intent: "order", orderId: idMatch?.[0] };
  }

  const policy = matchPolicyIntent(lower);
  if (policy) return { intent: "policy" };

  if (/trending|popular|best seller|hot picks/.test(lower)) return { intent: "trending" };

  const budgetMatch = lower.match(
    /(?:under|below|less than|max|budget)\s*(?:\$|usd|egp)?\s*([0-9,]+)|([0-9,]+)\s*(?:egp|usd|\$)/i,
  );
  if (budgetMatch) {
    const raw = (budgetMatch[1] || budgetMatch[2]).replace(/,/g, "");
    const usesEgp = /\begp\b/i.test(lower);
    return {
      intent: "budget",
      budget: Number(raw),
      currencyNote: usesEgp
        ? "Corner Store prices are in USD; your EGP amount is used as a numeric cap on USD prices."
        : undefined,
    };
  }

  if (/compare|versus|vs\.?|side by side|difference between/.test(lower)) return { intent: "compare" };

  if (/recommend|suggest|for me|personalized|what should i buy/.test(lower)) return { intent: "recommend" };

  for (const { pattern, term } of CATEGORY_ALIASES) {
    if (pattern.test(lower)) return { intent: "category", category: term };
  }

  if (/show me|looking for|find me|search/.test(lower)) {
    const term = q
      .replace(/^(show me|find me|looking for|search for?)\s+(the\s+)?/i, "")
      .replace(/[?.!]+$/, "")
      .trim();
    return { intent: "search", category: term || undefined };
  }

  return { intent: "search" };
}

async function loadProductsByIds(ids: number[]): Promise<Product[]> {
  const { getProductById } = await import("@/lib/services/products");
  const unique = [...new Set(ids)].slice(0, 4);
  const results = await Promise.all(
    unique.map(async (id) => {
      try {
        return mapProductDTO(await getProductById(id));
      } catch {
        return null;
      }
    }),
  );
  return results.filter((p): p is Product => p != null);
}

async function personalizedPicks(options: AssistantQueryOptions, count = 6): Promise<Product[]> {
  const ctx = {
    cartIds: options.cartProductIds,
    recentIds: options.recentProductIds,
  };
  const dtos = options.isSignedIn
    ? await getPersonalizedProducts(count, ctx)
    : await getPersonalizedProductsGuest(count, ctx);
  return dtos.map(mapProductDTO);
}

export async function runAssistantQuery(
  query: string,
  options: AssistantQueryOptions,
): Promise<AssistantMessage> {
  const parsed = parseIntent(query);
  setAssistantUsage();

  if (parsed.intent === "policy") {
    const policy = matchPolicyIntent(query.toLowerCase())!;
    return { role: "assistant", text: `${policy.title}: ${policy.body}` };
  }

  if (parsed.intent === "order") {
    if (!options.isSignedIn) {
      return {
        role: "assistant",
        text: "Sign in to track your Corner Store orders. Go to Account → Order History after login.",
      };
    }
    try {
      const orders = await getOrders();
      if (!orders.length) {
        return { role: "assistant", text: "You have no orders yet. Browse products and checkout when ready." };
      }
      if (parsed.orderId) {
        const match = orders.find((o) => o.id.toLowerCase().includes(parsed.orderId!.toLowerCase()));
        if (match) {
          return {
            role: "assistant",
            text: `Order ${match.id}: status ${match.status}, total $${match.total}, placed ${new Date(match.orderDate).toLocaleDateString()}.`,
          };
        }
      }
      const latest = orders[0];
      const summary = orders
        .slice(0, 3)
        .map((o) => `• ${o.id.slice(0, 8)}… — ${o.status} ($${o.total})`)
        .join("\n");
      return {
        role: "assistant",
        text: `Latest order: ${latest.status} ($${latest.total}). Recent orders:\n${summary}\nOpen Account → Orders for details.`,
      };
    } catch {
      return { role: "assistant", text: "Could not load orders. Make sure you are signed in and the API is running." };
    }
  }

  if (parsed.intent === "trending") {
    try {
      const products = (await getTrendingProducts(6)).map(mapProductDTO);
      return { role: "assistant", text: "Here are trending picks at Corner Store:", products };
    } catch {
      return { role: "assistant", text: "Trending products are unavailable right now." };
    }
  }

  const compareIds = options.compareIds ?? [];
  if (parsed.intent === "compare" && compareIds.length >= 2) {
    try {
      const products = await loadProductsByIds(compareIds);
      return {
        role: "assistant",
        text: `Your compare list (${products.length} items). Open the Compare link below for a side-by-side table, or tap + to adjust.`,
        products,
      };
    } catch {
      return {
        role: "assistant",
        text: "Could not load your compare list. Try adding products with + first.",
      };
    }
  }

  if (parsed.intent === "budget" && parsed.budget != null) {
    try {
      const products = (await getProductsByBudget(parsed.budget, 6)).map(mapProductDTO);
      if (!products.length) {
        return {
          role: "assistant",
          text: `No products at or below $${parsed.budget}. Try a higher budget.${parsed.currencyNote ? ` ${parsed.currencyNote}` : ""}`,
        };
      }
      const note = parsed.currencyNote ? `\n${parsed.currencyNote}` : "";
      return {
        role: "assistant",
        text: `Best-rated picks at or below $${parsed.budget}:${note}`,
        products,
      };
    } catch {
      return { role: "assistant", text: "Budget search is unavailable right now." };
    }
  }

  if (parsed.intent === "category" && parsed.category) {
    try {
      const products = (await getProductsByCategory(parsed.category, 6)).map(mapProductDTO);
      if (!products.length) {
        return { role: "assistant", text: `No matches in “${parsed.category}”. Try another category.` };
      }
      return {
        role: "assistant",
        text: `Top picks in ${parsed.category}:`,
        products,
      };
    } catch {
      return { role: "assistant", text: "Category browse failed. Is the API running?" };
    }
  }

  if (parsed.intent === "recommend") {
    try {
      const products = await personalizedPicks(options, 6);
      if (products.length) {
        return {
          role: "assistant",
          text: options.isSignedIn
            ? "Personalized picks from your cart, browsing, wishlist, and orders:"
            : "Recommended for you (sign in for order-based personalization):",
          products,
        };
      }
    } catch {
      // fall through to trending
    }
    try {
      const products = (await getTrendingProducts(6)).map(mapProductDTO);
      return { role: "assistant", text: "Here are popular picks while we learn your taste:", products };
    } catch {
      return { role: "assistant", text: "Recommendations are unavailable right now." };
    }
  }

  if (parsed.intent === "compare") {
    try {
      const products = (await getTrendingProducts(4)).map(mapProductDTO);
      return {
        role: "assistant",
        text: "Tap + on two to four items to compare, then use the Compare link. Here are ideas to start:",
        products,
      };
    } catch {
      return {
        role: "assistant",
        text: "Add products with + (up to 4), then open Compare for a side-by-side table.",
      };
    }
  }

  if (parsed.intent === "search") {
    const term =
      parsed.category?.trim() ||
      query.replace(/^(show me|find me|looking for|search for?)\s+(the\s+)?/i, "").trim();
    if (term.length >= 2) {
      try {
        const page = await getProducts({ search: term, pageIndex: 1, pageSize: 10 });
        const products = page.data.map(mapProductDTO);
        if (products.length) {
          return { role: "assistant", text: `Results for “${term}”:`, products };
        }
        return {
          role: "assistant",
          text: `No products matched “${term}”. Try another keyword or browse Categories.`,
        };
      } catch {
        return { role: "assistant", text: "Product search is unavailable. Is the API running?" };
      }
    }
  }

  if (parsed.category) {
    try {
      const products = (await getProductsByCategory(parsed.category, 4)).map(mapProductDTO);
      if (products.length) {
        return { role: "assistant", text: `Results for “${query}”:`, products };
      }
    } catch {
      // ignore
    }
  }

  return {
    role: "assistant",
    text: "Try: “phones under 500”, “compare gaming headphones”, “what is your return policy?”, or “where is my order?” when signed in.",
  };
}

export function setAssistantUsage() {
  try {
    const key = "corner_store_assistant_usage";
    const count = Number(localStorage.getItem(key) ?? "0") + 1;
    localStorage.setItem(key, String(count));
  } catch {
    // ignore
  }
}

export function getAssistantUsageCount(): number {
  try {
    return Number(localStorage.getItem("corner_store_assistant_usage") ?? "0");
  } catch {
    return 0;
  }
}
