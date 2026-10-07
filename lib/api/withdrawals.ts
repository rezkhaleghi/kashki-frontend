import { apiClient } from "@/lib/api/client";
import type { Paginated, Withdrawal } from "@/lib/types";

export type CreateWithdrawalInput = {
  currency: string;
  amount: string;
  destination: string;
};

export async function listWithdrawals(params?: { page?: number; limit?: number; sortBy?: "createdAt" | "amount"; sortDirection?: "ASC" | "DESC" }) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.sortBy) search.set("sortBy", String(params.sortBy));
  if (params?.sortDirection) search.set("sortDirection", params.sortDirection);

  const query = search.toString();
  return apiClient<Paginated<Withdrawal>>(`/withdrawals${query ? `?${query}` : ""}`);
}

export async function getWithdrawal(id: string) {
  return apiClient<Withdrawal>(`/withdrawals/${id}`);
}

export async function createWithdrawal(input: CreateWithdrawalInput) {
  return apiClient<Withdrawal>("/withdrawals", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
