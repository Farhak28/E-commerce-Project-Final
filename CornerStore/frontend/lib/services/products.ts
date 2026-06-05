import { apiClient, serverApiClient } from "@/lib/services/api-client";
import type {
  BrandDTO,
  PaginatedResult,
  ProductDTO,
  ProductQueryParams,
  TypeDTO,
} from "@/lib/types";
import type { ReviewSummary } from "@/lib/types/assistant";

function toQueryParams(params: ProductQueryParams): Record<string, string | number> {
  const q: Record<string, string | number> = {};
  if (params.brandId != null) q.brandId = params.brandId;
  if (params.typeId != null) q.typeId = params.typeId;
  if (params.search) q.search = params.search;
  if (params.sort != null) q.sort = params.sort;
  if (params.pageIndex != null) q.pageIndex = params.pageIndex;
  if (params.pageSize != null) q.pageSize = params.pageSize;
  return q;
}

export async function getProducts(params: ProductQueryParams = {}) {
  return apiClient<PaginatedResult<ProductDTO>>("/Products", {
    params: toQueryParams(params),
    skipAuth: true,
  });
}

/** Fetches every product by paging through the API (max 10 per page on the backend). */
export async function getAllProducts(
  params: Omit<ProductQueryParams, "pageIndex" | "pageSize"> = {},
) {
  const pageSize = 10;
  let pageIndex = 1;
  const data: ProductDTO[] = [];
  let count = 0;

  while (true) {
    const page = await getProducts({ ...params, pageIndex, pageSize });
    count = page.count;
    data.push(...page.data);
    if (data.length >= count || page.data.length === 0) break;
    pageIndex += 1;
  }

  return {
    pageIndex: 1,
    pageSize: data.length,
    count,
    data,
  } satisfies PaginatedResult<ProductDTO>;
}

export async function getProductsServer(params: ProductQueryParams = {}) {
  return serverApiClient<PaginatedResult<ProductDTO>>("/Products", toQueryParams(params));
}

export async function getProductById(id: number) {
  return apiClient<ProductDTO>(`/Products/${id}`, { skipAuth: true });
}

export async function getProductByIdServer(id: number) {
  return serverApiClient<ProductDTO>(`/Products/${id}`);
}

export async function getBrands() {
  return apiClient<BrandDTO[]>("/Products/brands", { skipAuth: true });
}

export async function getBrandsServer() {
  return serverApiClient<BrandDTO[]>("/Products/brands");
}

export async function getTypes() {
  return apiClient<TypeDTO[]>("/Products/types", { skipAuth: true });
}

export async function getTypesServer() {
  return serverApiClient<TypeDTO[]>("/Products/types");
}

/** Same as GET /api/Products/{id}/recommendations — also available via /api/Recommendations/similar/{id} */
export async function getProductRecommendations(id: number, count = 5) {
  return apiClient<ProductDTO[]>(`/Products/${id}/recommendations`, {
    params: { count },
    skipAuth: true,
  });
}

export async function getProductReviewSummary(id: number) {
  return apiClient<ReviewSummary>(`/Products/${id}/review-summary`, { skipAuth: true });
}
