import { apiClient } from "@/lib/api/client";
import type {
  Paginated,
  PublicUserProfile,
  User,
  UserBalance,
  UserSearchResult,
} from "@/lib/types";

export async function getMe() {
  return apiClient<User>("/users/me");
}

export async function updateMe(input: Partial<{
  firstName: string | null;
  lastName: string | null;
  userName: string;
  dateOfBirth: string | null;
  bio: string | null;
  hideYear: boolean;
}>) {
  return apiClient<User>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function getMyBalances(params?: { page?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));

  const query = search.toString();
  return apiClient<Paginated<UserBalance>>(`/users/me/balances${query ? `?${query}` : ""}`);
}

export async function searchUsers(query: string, page = 1, limit = 20) {
  const params = new URLSearchParams({ q: query, page: String(page), limit: String(limit) });
  return apiClient<Paginated<UserSearchResult>>(`/users/search?${params.toString()}`);
}

export async function getPublicUserProfile(username: string) {
  return apiClient<PublicUserProfile>(`/users/${encodeURIComponent(username)}`);
}
