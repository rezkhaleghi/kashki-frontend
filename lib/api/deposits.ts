import { apiClient } from "@/lib/api/client";
import type { Deposit, Paginated } from "@/lib/types";

export type CreateDepositInput = {
  provider: string;
  currency: string;
  amount: string;
};

export async function listDeposits(params?: { page?: number; limit?: number; sortBy?: "createdAt" | "amount"; sortDirection?: "ASC" | "DESC" }) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.sortBy) search.set("sortBy", params.sortBy);
  if (params?.sortDirection) search.set("sortDirection", params.sortDirection);

  const query = search.toString();
  return apiClient<Paginated<Deposit>>(`/deposits${query ? `?${query}` : ""}`);
}

export async function getDeposit(id: string) {
  return apiClient<Deposit>(`/deposits/${id}`);
}

export async function createDeposit(
  input: CreateDepositInput,
  idempotencyKey = crypto.randomUUID(),
) {
  return apiClient<Deposit>("/deposits", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(input),
  });
}

export async function verifyDeposit(id: string) {
  return apiClient<Deposit>(`/deposits/${id}/verify`, {
    method: "POST",
  });
}
