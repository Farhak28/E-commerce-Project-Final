import { apiClient } from "@/lib/services/api-client";

export type ReviewDTO = {
  id: number;
  productId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type CreateReviewDTO = {
  userName?: string;
  rating: number;
  comment: string;
};

export async function getProductReviews(productId: number) {
  return apiClient<ReviewDTO[]>(`/Products/${productId}/reviews`, { skipAuth: true });
}

export async function addProductReview(productId: number, body: CreateReviewDTO) {
  return apiClient<ReviewDTO>(`/Products/${productId}/reviews`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
