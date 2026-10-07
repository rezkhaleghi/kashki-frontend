import { apiClient } from "@/lib/api/client";
import type { ListEntity, Paginated } from "@/lib/types";

export type CreateListInput = {
  name: string;
  description?: string | null;
  visibility?: "PUBLIC" | "UNLISTED" | "PRIVATE";
};

export async function listMyLists(params?: { page?: number; limit?: number; sortBy?: "createdAt" | "name"; sortDirection?: "ASC" | "DESC" }) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.sortBy) search.set("sortBy", params.sortBy);
  if (params?.sortDirection) search.set("sortDirection", params.sortDirection);

  const query = search.toString();
  return apiClient<Paginated<ListEntity>>(`/lists${query ? `?${query}` : ""}`);
}

export async function createList(input: CreateListInput) {
  return apiClient<ListEntity>("/lists", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getList(id: string) {
  return apiClient<ListEntity>(`/lists/${id}`);
}

export async function updateList(id: string, input: Partial<CreateListInput>) {
  return apiClient<ListEntity>(`/lists/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteList(id: string) {
  return apiClient<{ message: string }>(`/lists/${id}`, {
    method: "DELETE",
  });
}
