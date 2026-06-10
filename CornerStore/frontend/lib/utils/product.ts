import type { Product, ProductDTO } from "@/lib/types";
import { resolvePictureUrl } from "@/lib/utils/images";

function normalizeNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getStableRating(id: number) {
  const base = 3 + ((id % 3) * 0.5);
  return Number(base.toFixed(1));
}

function getStableStock(id: number) {
  return normalizeNumber(5 + ((id * 7) % 20), 1, 50);
}

function deriveFeatures(description: string) {
  const parts = description.split(/\.\s+/).filter(Boolean);
  if (parts.length >= 3) {
    return parts.slice(0, 3).map((part) => part.trim()).map((part) => (part.endsWith(".") ? part.slice(0, -1) : part));
  }
  return ["High-quality build", "Modern product experience", "Designed for everyday use"];
}

export function mapProductDTO(dto: ProductDTO): Product {
  const hasReviews = (dto.reviewCount ?? 0) > 0;
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    pictureUrl: resolvePictureUrl(dto.pictureUrl),
    price: dto.price,
    productType: dto.productType,
    productBrand: dto.productBrand,
    brandOfficialUrl: dto.brandOfficialUrl,
    rating: hasReviews && dto.averageRating != null ? dto.averageRating : getStableRating(dto.id),
    reviewCount: dto.reviewCount,
    stock: dto.stockQuantity ?? getStableStock(dto.id),
    keyFeatures: deriveFeatures(dto.description),
  };
}

export function toTypeSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function findTypeBySlug<T extends { id: number; name: string }>(
  types: T[],
  slug: string,
): T | undefined {
  return types.find((t) => toTypeSlug(t.name) === slug);
}
