import type { ProductDTO } from "@/lib/types";

export type VisualProductAttributes = {
  category?: string | null;
  productType?: string | null;
  brand?: string | null;
  color?: string | null;
  material?: string | null;
  style?: string | null;
  productName?: string | null;
  features: string[];
  keywords: string[];
  confidence: number;
};

export type VisualProductMatch = {
  product: ProductDTO;
  matchPercentage: number;
  matchTier: "exact" | "similar" | "alternative";
};

export type VisualSearchResponse = {
  text: string;
  exactMatchFound: boolean;
  attributes: VisualProductAttributes;
  exactMatches: VisualProductMatch[];
  similarProducts: VisualProductMatch[];
  alternatives: VisualProductMatch[];
  sessionId?: string | null;
};

export type VisualSearchAnalytics = {
  totalSearches: number;
  searchesToday: number;
  matchSuccessRate: number;
  searchesByDay: { date: string; count: number }[];
  topCategories: { category: string; count: number }[];
  topBrands: { category: string; count: number }[];
};
