import { BASKET_ID_KEY } from "@/lib/constants/storage";

export function getOrCreateBasketId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(BASKET_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(BASKET_ID_KEY, id);
  }
  return id;
}

export function clearBasketId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BASKET_ID_KEY);
}
