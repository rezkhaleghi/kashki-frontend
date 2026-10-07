import { apiClient } from "@/lib/api/client";
import type { Paginated, WishEntity } from "@/lib/types";

export type CreateWishInput = {
  title: string;
  description?: string | null;
  links?: string[];
  targetAmount?: string | null;
  currency?: string | null;
};

export async function listWishes(listId: string, params?: { page?: number; limit?: number; sortBy?: "createdAt" | "title"; sortDirection?: "ASC" | "DESC" }) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.sortBy) search.set("sortBy", params.sortBy);
  if (params?.sortDirection) search.set("sortDirection", params.sortDirection);

  const query = search.toString();
  return apiClient<Paginated<WishEntity>>(`/lists/${listId}/wishes${query ? `?${query}` : ""}`);
}

export async function createWish(listId: string, input: CreateWishInput) {
  return apiClient<WishEntity>(`/lists/${listId}/wishes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateWish(listId: string, wishId: string, input: Partial<CreateWishInput>) {
  return apiClient<WishEntity>(`/lists/${listId}/wishes/${wishId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteWish(listId: string, wishId: string) {
  return apiClient<{ message: string }>(`/lists/${listId}/wishes/${wishId}`, {
    method: "DELETE",
  });
}
