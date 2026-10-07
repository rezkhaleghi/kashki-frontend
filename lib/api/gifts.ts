import { apiClient } from "@/lib/api/client";
import type { Gift, Paginated } from "@/lib/types";

export type CreateGiftInput = {
  wishId?: string | null;
  recipientUserId?: string | null;
  amount: string;
  currency: string;
  anonymous?: boolean;
  message?: string | null;
};

export async function createGift(input: CreateGiftInput) {
  return apiClient<Gift>("/gifts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listGivenGifts(params?: { page?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  const query = search.toString();
  return apiClient<Paginated<Gift>>(`/gifts/given${query ? `?${query}` : ""}`);
}

export async function listReceivedGifts(params?: { page?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  const query = search.toString();
  return apiClient<Paginated<Gift>>(`/gifts/received${query ? `?${query}` : ""}`);
}

export async function listWishGifts(wishId: string, params?: { page?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  const query = search.toString();
  return apiClient<Paginated<Gift>>(`/wishes/${wishId}/gifts${query ? `?${query}` : ""}`);
}
