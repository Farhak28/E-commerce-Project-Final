/** Mirrors backend DTOs — keep in sync with ECommerce.Shared */

export type ProductDTO = {
  id: number;
  name: string;
  description: string;
  pictureUrl: string;
  price: number;
  productType: string;
  productBrand: string;
  brandOfficialUrl?: string | null;
  averageRating?: number;
  reviewCount?: number;
  stockQuantity?: number;
};

export type BrandDTO = {
  id: number;
  name: string;
  officialWebsiteUrl?: string | null;
};

export type TypeDTO = {
  id: number;
  name: string;
};

export type PaginatedResult<T> = {
  pageIndex: number;
  pageSize: number;
  count: number;
  data: T[];
};

export enum ProductSortingOptions {
  NameAsc = 1,
  NameDesc = 2,
  PriceAsc = 3,
  PriceDesc = 4,
}

export type ProductQueryParams = {
  brandId?: number;
  typeId?: number;
  search?: string;
  sort?: ProductSortingOptions;
  pageIndex?: number;
  pageSize?: number;
};

export type UserDTO = {
  email: string;
  displayName: string;
  token: string;
  roles: string[];
};

export type LoginDTO = {
  email: string;
  password: string;
};

export type RegisterDTO = {
  email: string;
  displayName: string;
  userName: string;
  password: string;
  phoneNumber: string;
  addresses?: UpsertSavedAddressDTO[];
};

export type SavedAddressDTO = {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  city: string;
  street: string;
  country: string;
};

export type UpsertSavedAddressDTO = {
  id?: number;
  name: string;
  firstName: string;
  lastName: string;
  city: string;
  street: string;
  country: string;
};

export type AddressDTO = {
  firstName: string;
  lastName: string;
  city: string;
  street: string;
  country: string;
};

export type BasketItemDTO = {
  id: number;
  productName: string | null;
  pictureUrl: string | null;
  price: number;
  quantity: number;
};

export type BasketDTO = {
  id: string;
  deliveryMethodId: number | null;
  shippingPrice: number;
  scheduledDeliveryAt?: string | null;
  couponCode?: string | null;
  discountAmount?: number;
  paymentIntentID: string | null;
  clientSecret: string | null;
  items: BasketItemDTO[];
};

export type UserCouponDTO = {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: string;
  discountValue: number;
  maxDiscount?: number | null;
  minOrderAmount: number;
  isUsed: boolean;
  expiresAt: string;
  discountLabel: string;
};

export type DeliveryQuoteLineDTO = {
  label: string;
  amount: number;
};

export type DeliveryQuoteDTO = {
  deliveryMethodId: number;
  deliveryMethodName: string;
  basePrice: number;
  totalPrice: number;
  scheduledDeliveryAt?: string | null;
  lines: DeliveryQuoteLineDTO[];
};

export type DeliveryMethodDTO = {
  id: number;
  shortName: string;
  description: string;
  deliveryTime: string;
  price: number;
};

export type OrderDTO = {
  basketId: string;
  deliveryMethodId: number;
  shipToAddress: AddressDTO;
  paymentMethod?: number;
  scheduledDeliveryAt?: string;
  couponCode?: string;
};

export type OrderItemDTO = {
  productName: string;
  pictureUrl: string;
  price: number;
  quantity: number;
};

export type OrderToReturnDTO = {
  id: string;
  userEmail: string;
  items: OrderItemDTO[];
  address: AddressDTO;
  deliveryMethod: string;
  deliveryMethodId?: number;
  paymentIntentId: string;
  paymentMethod?: string;
  status: string;
  fulfillmentStage?: string;
  trackingNumber?: string | null;
  carrierName?: string;
  progressPercent?: number;
  trackingHeadline?: string;
  orderDate: string;
  subtotal: number;
  deliveryPrice?: number;
  couponCode?: string | null;
  discountAmount?: number;
  total: number;
  scheduledDeliveryAt?: string | null;
  cancelledAt?: string | null;
  returnRequestedAt?: string | null;
  returnReason?: string | null;
  canCancel?: boolean;
  canReturn?: boolean;
  canSchedule?: boolean;
};

export type OrderTrackingStepDTO = {
  stage: string;
  title: string;
  description: string;
  location?: string | null;
  occurredAt?: string | null;
  isComplete: boolean;
  isCurrent: boolean;
};

export type OrderTrackingDTO = {
  orderId: string;
  status: string;
  fulfillmentStage: string;
  trackingNumber?: string | null;
  carrierName: string;
  progressPercent: number;
  headline: string;
  subheadline: string;
  estimatedDeliveryAt?: string | null;
  steps: OrderTrackingStepDTO[];
};

export type WishlistDTO = {
  userEmail: string;
  productIds: number[];
};

export type AdminUserDTO = {
  id: string;
  email: string;
  displayName: string;
  phoneNumber: string | null;
  roles: string[];
  ordersCount: number;
};

export type AdminStatsDTO = {
  usersCount: number;
  ordersCount: number;
  revenue: number;
  productsCount: number;
  pendingOrdersCount: number;
  lowStockCount: number;
  activeShipmentsCount: number;
  deliveredOrdersCount: number;
  scheduledDeliveriesCount: number;
  activeCouponsCount: number;
  redeemedCouponsCount: number;
  totalDiscountsGiven: number;
  reviewsCount: number;
  brandsWithOfficialUrlCount: number;
};

export type FulfillmentByStageDTO = {
  stage: string;
  count: number;
};

export type AdminCouponsSummaryDTO = {
  activeCoupons: number;
  redeemedCoupons: number;
  expiredCoupons: number;
  totalDiscountsGiven: number;
  couponsByReward: { rewardKey: string; active: number; redeemed: number }[];
};

export type RevenueByMonthDTO = {
  label: string;
  amount: number;
};

export type OrdersByStatusDTO = {
  status: string;
  count: number;
};

export type AdminAnalyticsDTO = {
  revenueByMonth: RevenueByMonthDTO[];
  ordersByStatus: OrdersByStatusDTO[];
  fulfillmentByStage: FulfillmentByStageDTO[];
  assistantUsageEstimate: number;
  scheduledDeliveriesCount: number;
  totalDeliveryRevenue: number;
  totalDiscountsGiven: number;
  visualSearchEventsCount: number;
};

export type NotificationDTO = {
  id: number;
  title: string;
  body: string;
  isRead: boolean;
  category: string;
  createdAt: string;
};

export type AccountDashboardDTO = {
  totalOrders: number;
  activeOrders: number;
  rewardPoints: number;
  loyaltyTier: string;
  profileCompletionPercent: number;
  availableCoupons: number;
  topInterests: string[];
  savedPreferences: string[];
  lastViewedSummary: string | null;
};

export type AdminOrderQueryParams = {
  userEmail?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type AdminListQueryParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type AdminPagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type AdminReviewDTO = {
  id: number;
  productId: number;
  productName: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type AuditLogDTO = {
  id: number;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
};

export type AuditLogsPageDTO = {
  items: AuditLogDTO[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type AdminReportsDTO = {
  revenueByMonth: RevenueByMonthDTO[];
  ordersByStatus: OrdersByStatusDTO[];
  lowStockProducts: number;
  totalReviews: number;
  averageRating: number;
};

export type KnowledgeChunkDTO = {
  id: number;
  documentId: number;
  documentTitle: string;
  chunkIndex: number;
  textPreview: string;
  hasEmbedding: boolean;
  createdAt: string;
};

export type KnowledgeChunksPageDTO = {
  items: KnowledgeChunkDTO[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type AssistantInteractionLogDetailDTO = AssistantInteractionLogDTO & {
  retrievedChunks: string | null;
};

export type AiConfigDTO = {
  provider: string;
  modelName: string;
  embeddingModelName: string;
  temperature: number;
  chunkSize: number;
  topKRetrieval: number;
  historyLength: number;
  maxToolIterations: number;
  enableStartupIndexing: boolean;
  geminiConfigured: boolean;
  systemPromptSummary: string | null;
};

export type AiCostSummaryDTO = {
  totalPromptTokens: number;
  totalResponseTokens: number;
  estimatedCostUsd: number;
  conversationsWithTokens: number;
};

export type ProductRecommendationStatDTO = {
  productId: number;
  productName: string;
  impressionCount: number;
  clickCount: number;
  clickRate: number;
};

export type RecommendationAnalyticsDTO = {
  totalImpressions: number;
  totalClicks: number;
  overallClickRate: number;
  aiRecommendationRequests: number;
  topRecommended: ProductRecommendationStatDTO[];
  trendingProducts: ProductRecommendationStatDTO[];
};

export type CreateProductDTO = {
  name: string;
  description: string;
  pictureUrl: string;
  price: number;
  productBrandId: number;
  productTypeId: number;
  stockQuantity?: number;
};

export type UpdateProductDTO = CreateProductDTO;

export type CreateAdminUserDTO = {
  email: string;
  displayName: string;
  userName?: string;
  password: string;
  phoneNumber?: string;
  roles: string[];
};

export type UpdateAdminUserDTO = {
  displayName: string;
  phoneNumber?: string;
  roles: string[];
  password?: string;
};

export type ProductImageUploadResultDTO = {
  pictureUrl: string;
};

export type AdminAiOverviewDTO = {
  totalConversations: number;
  conversationsToday: number;
  uniqueSessions: number;
  averageLatencyMs: number;
  totalKnowledgeDocuments: number;
  totalKnowledgeChunks: number;
  lastIndexedAt: string | null;
  productSearchRequests: number;
  comparisonRequests: number;
  orderStatusRequests: number;
  recommendationRequests: number;
  geminiConfigured: boolean;
  geminiModel: string | null;
  geminiProvider: string | null;
};

export type AssistantInteractionLogDTO = {
  id: number;
  sessionId: string | null;
  userEmail: string | null;
  userPrompt: string;
  assistantResponse: string;
  toolCalls: string | null;
  latencyMs: number;
  promptTokens: number | null;
  responseTokens: number | null;
  createdAt: string;
};

export type AdminAiLogsPageDTO = {
  items: AssistantInteractionLogDTO[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type KnowledgeStatsDTO = {
  documentCount: number;
  chunkCount: number;
  lastUpdatedAt: string | null;
  byCategory: { category: string; count: number }[];
};

export type SystemHealthDTO = {
  apiHealthy: boolean;
  databaseHealthy: boolean;
  geminiConfigured: boolean;
  vectorStoreHealthy: boolean;
  vectorStoreType: string;
  geminiModel: string | null;
  message: string | null;
};

export type DailyChatCountDTO = { date: string; count: number };

export type AdminAiAnalyticsDTO = {
  chatsByDay: DailyChatCountDTO[];
  toolUsage: { toolName: string; count: number }[];
  topPrompts: { prompt: string; count: number }[];
};

export type KnowledgeDocumentDTO = {
  id: number;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateKnowledgeDocumentDTO = {
  title: string;
  content: string;
  category: string;
};

export type UpdateKnowledgeDocumentDTO = CreateKnowledgeDocumentDTO;

/** UI-friendly product shape used across components */
export type Product = {
  id: number;
  name: string;
  description: string;
  pictureUrl: string;
  price: number;
  productType: string;
  productBrand: string;
  brandOfficialUrl?: string | null;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  keyFeatures?: string[];
};

export type CartLineItem = {
  product: Product;
  qty: number;
};
