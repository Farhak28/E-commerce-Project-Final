import type { ProductDTO } from "@/lib/types";

export type AssistantContextDTO = {
  cartProductIds?: number[];
  recentProductIds?: number[];
  compareIds?: number[];
  basketId?: string | null;
};

export type AssistantChatMessageDTO = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantChatRequestDTO = {
  sessionId?: string | null;
  message: string;
  context?: AssistantContextDTO;
  history?: AssistantChatMessageDTO[];
};

export type ComparisonProduct = {
  id: number;
  name: string;
  pictureUrl?: string | null;
  price: number;
  averageRating: number;
  reviewCount: number;
  stockQuantity: number;
  productType: string;
  productBrand: string;
  description: string;
};

export type OrderStatusItem = {
  id: string;
  status: string;
  total: number;
  orderDate: string;
};

export type ReviewSummary = {
  productId: number;
  productName: string;
  averageRating: number;
  totalReviews: number;
  positivePercentage: number;
  neutralPercentage: number;
  negativePercentage: number;
  positiveThemes: string[];
  negativeThemes: string[];
  summary: string;
};

export type AssistantStructuredData = {
  comparison?: { products: ComparisonProduct[]; recommendedProductId?: string | null } | null;
  orders?: { orders: OrderStatusItem[]; highlightedOrder?: OrderStatusItem | null } | null;
  reviewSummary?: ReviewSummary | null;
};

export type AssistantChatResponseDTO = {
  sessionId: string;
  text: string;
  products?: ProductDTO[] | null;
  configured: boolean;
  provider?: string | null;
  structured?: AssistantStructuredData | null;
};

export type AssistantStatusDTO = {
  configured: boolean;
  provider?: string | null;
  model?: string | null;
};

export type AssistantSessionHistoryDTO = {
  sessionId: string;
  messages: AssistantChatMessageDTO[];
};
