import { apiClient } from "@/lib/services/api-client";
import type {
  KnowledgeChunksPageDTO,
  KnowledgeDocumentDTO,
} from "@/lib/types";

export async function getKnowledgeDocuments(category?: string): Promise<KnowledgeDocumentDTO[]> {
  return apiClient<KnowledgeDocumentDTO[]>("/Knowledge", {
    params: category ? { category } : undefined,
  });
}

export async function getKnowledgeChunks(
  documentId?: number,
  page = 1,
  pageSize = 20,
): Promise<KnowledgeChunksPageDTO> {
  if (documentId != null) {
    return apiClient<KnowledgeChunksPageDTO>(`/Knowledge/${documentId}/chunks`, {
      params: { page, pageSize },
    });
  }
  return apiClient<KnowledgeChunksPageDTO>("/Knowledge/chunks", {
    params: { page, pageSize },
  });
}

export async function createKnowledgeDocument(dto: {
  title: string;
  content: string;
  category: string;
}): Promise<KnowledgeDocumentDTO> {
  return apiClient<KnowledgeDocumentDTO>("/Knowledge", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function updateKnowledgeDocument(
  id: number,
  dto: { title: string; content: string; category: string },
): Promise<KnowledgeDocumentDTO> {
  return apiClient<KnowledgeDocumentDTO>(`/Knowledge/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

export async function deleteKnowledgeDocument(id: number): Promise<void> {
  return apiClient<void>(`/Knowledge/${id}`, { method: "DELETE" });
}

export async function reindexAllKnowledge(): Promise<void> {
  return apiClient<void>("/Knowledge/reindex-all", { method: "POST" });
}

export async function reindexKnowledgeDocument(id: number): Promise<void> {
  return apiClient<void>(`/Knowledge/${id}/reindex`, { method: "POST" });
}
