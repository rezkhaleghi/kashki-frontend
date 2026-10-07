import { apiClient } from "@/lib/api/client";
import type { Notification, Paginated } from "@/lib/types";

export async function listNotifications(params?: {
  page?: number;
  limit?: number;
  channel?: string;
  type?: string;
  sortDirection?: "ASC" | "DESC";
}) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.channel) search.set("channel", params.channel);
  if (params?.type) search.set("type", params.type);
  if (params?.sortDirection) search.set("sortDirection", params.sortDirection);

  const query = search.toString();
  return apiClient<Paginated<Notification>>(`/notifications${query ? `?${query}` : ""}`);
}

export async function markNotificationAsRead(id: string) {
  return apiClient<Notification>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}
