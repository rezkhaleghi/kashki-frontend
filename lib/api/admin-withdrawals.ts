import { apiClient } from "@/lib/api/client";
import type { Paginated, Withdrawal } from "@/lib/types";

export type AdminWithdrawalFilters = {
  page?: number;
  limit?: number;
  currency?: string;
  status?: Withdrawal["status"];
  sortBy?: "createdAt" | "amount";
  sortDirection?: "ASC" | "DESC";
};

export type UpdateAdminWithdrawalStatus = {
  status: "APPROVED" | "REJECTED" | "COMPLETED";
  reason?: string;
  transactionId?: string;
};

export async function listAdminWithdrawals(filters: AdminWithdrawalFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const query = params.toString();
  return apiClient<Paginated<Withdrawal>>(`/admin/withdrawals${query ? `?${query}` : ""}`);
}

export async function getAdminWithdrawal(id: string) {
  return apiClient<Withdrawal>(`/admin/withdrawals/${id}`);
}

export async function updateAdminWithdrawal(
  id: string,
  input: UpdateAdminWithdrawalStatus,
) {
  return apiClient<Withdrawal>(`/admin/withdrawals/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
