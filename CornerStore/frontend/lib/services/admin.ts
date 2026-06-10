import { apiClient, apiUpload } from "@/lib/services/api-client";
import type {
  AdminAnalyticsDTO,
  AdminCouponsSummaryDTO,
  AdminListQueryParams,
  OrderTrackingDTO,
  AdminOrderQueryParams,
  AdminPagedResult,
  AdminReportsDTO,
  AdminReviewDTO,
  AdminStatsDTO,
  AdminUserDTO,
  AuditLogsPageDTO,
  CreateAdminUserDTO,
  CreateProductDTO,
  OrderToReturnDTO,
  ProductDTO,
  ProductImageUploadResultDTO,
  UpdateAdminUserDTO,
  UpdateProductDTO,
} from "@/lib/types";

export async function getAdminStats(): Promise<AdminStatsDTO> {
  return apiClient<AdminStatsDTO>("/Admin/stats");
}

export async function getAdminAnalytics(): Promise<AdminAnalyticsDTO> {
  return apiClient<AdminAnalyticsDTO>("/Admin/analytics");
}

export async function getAdminReports(): Promise<AdminReportsDTO> {
  return apiClient<AdminReportsDTO>("/Admin/reports");
}

export async function getAdminUsers(
  params: AdminListQueryParams = {},
): Promise<AdminPagedResult<AdminUserDTO>> {
  return apiClient<AdminPagedResult<AdminUserDTO>>("/Admin/users", {
    params: { search: params.search, page: params.page, pageSize: params.pageSize },
  });
}

export async function getAdminUserById(id: string): Promise<AdminUserDTO> {
  return apiClient<AdminUserDTO>(`/Admin/users/${id}`);
}

export async function createAdminUser(dto: CreateAdminUserDTO): Promise<AdminUserDTO> {
  return apiClient<AdminUserDTO>("/Admin/users", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function updateAdminUser(id: string, dto: UpdateAdminUserDTO): Promise<AdminUserDTO> {
  return apiClient<AdminUserDTO>(`/Admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

export async function deleteAdminUser(id: string): Promise<void> {
  return apiClient<void>(`/Admin/users/${id}`, { method: "DELETE" });
}

export async function getAdminProducts(
  params: AdminListQueryParams = {},
): Promise<AdminPagedResult<ProductDTO>> {
  return apiClient<AdminPagedResult<ProductDTO>>("/Admin/products", {
    params: { search: params.search, page: params.page, pageSize: params.pageSize },
  });
}

export async function createAdminProduct(dto: CreateProductDTO): Promise<ProductDTO> {
  return apiClient<ProductDTO>("/Admin/products", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function updateAdminProduct(id: number, dto: UpdateProductDTO): Promise<ProductDTO> {
  return apiClient<ProductDTO>(`/Admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

export async function deleteAdminProduct(id: number): Promise<void> {
  return apiClient<void>(`/Admin/products/${id}`, { method: "DELETE" });
}

export async function uploadProductImage(file: File): Promise<ProductImageUploadResultDTO> {
  return apiUpload<ProductImageUploadResultDTO>("/Admin/products/upload-image", file);
}

export async function getAdminOrders(
  params: AdminOrderQueryParams = {},
): Promise<AdminPagedResult<OrderToReturnDTO>> {
  return apiClient<AdminPagedResult<OrderToReturnDTO>>("/Admin/orders", {
    params: {
      userEmail: params.userEmail,
      status: params.status,
      search: params.search,
      page: params.page,
      pageSize: params.pageSize,
    },
  });
}

export async function getAdminOrderById(id: string): Promise<OrderToReturnDTO> {
  return apiClient<OrderToReturnDTO>(`/Admin/orders/${id}`);
}

export async function getAdminOrderTracking(id: string): Promise<OrderTrackingDTO> {
  return apiClient<OrderTrackingDTO>(`/Admin/orders/${id}/tracking`);
}

export async function advanceAdminOrderTracking(id: string): Promise<OrderTrackingDTO> {
  return apiClient<OrderTrackingDTO>(`/Admin/orders/${id}/tracking/advance`, { method: "POST" });
}

export async function getAdminCouponsSummary(): Promise<AdminCouponsSummaryDTO> {
  return apiClient<AdminCouponsSummaryDTO>("/Admin/coupons/summary");
}

export async function getAdminReviews(
  params: AdminListQueryParams = {},
): Promise<AdminPagedResult<AdminReviewDTO>> {
  return apiClient<AdminPagedResult<AdminReviewDTO>>("/Admin/reviews", {
    params: { search: params.search, page: params.page, pageSize: params.pageSize },
  });
}

export async function deleteAdminReview(id: number): Promise<void> {
  return apiClient<void>(`/Admin/reviews/${id}`, { method: "DELETE" });
}

export async function getAdminAuditLogs(
  page = 1,
  pageSize = 20,
  search?: string,
): Promise<AuditLogsPageDTO> {
  return apiClient<AuditLogsPageDTO>("/Admin/audit-logs", {
    params: { page, pageSize, search },
  });
}
