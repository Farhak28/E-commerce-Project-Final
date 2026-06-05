import { RECENTLY_VIEWED_KEY } from "@/lib/constants/storage";

/** TODO: Backend has no recently-viewed endpoint — local IDs only until API exists */
const MAX_ITEMS = 12;

export function getRecentlyViewedIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is number => typeof x === "number");
  } catch {
    return [];
  }
}

export function addRecentlyViewed(productId: number): void {
  if (typeof window === "undefined") return;
  const current = getRecentlyViewedIds().filter((id) => id !== productId);
  const next = [productId, ...current].slice(0, MAX_ITEMS);
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
}
