import { apiClient } from "@/lib/api/client";

export async function uploadAvatar(file: File) {
  const body = new FormData();
  body.append("file", file);
  return apiClient<void>("/files/me/avatar", {
    method: "POST",
    body,
  });
}

export async function deleteAvatar() {
  return apiClient<void>("/files/me/avatar", {
    method: "DELETE",
  });
}
