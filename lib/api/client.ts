const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly data: unknown,
  ) {
    super(
      typeof data === "object" &&
        data !== null &&
        "message" in data &&
        (typeof data.message === "string" || Array.isArray(data.message))
        ? Array.isArray(data.message)
          ? data.message.filter((item): item is string => typeof item === "string").join(", ")
          : data.message
        : `Request failed with status ${status}`,
    );

    this.name = "ApiError";
  }
}

/**
 * All frontend API requests go through this client.
 *
 * Keeping fetch configuration here prevents individual pages and hooks
 * from accidentally handling sessions, JSON responses, 204 responses,
 * or backend errors differently.
 */
export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  // Several Kashki endpoints intentionally return 204 after a successful
  // mutation (for example avatar update/delete).
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";

  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("kashki:unauthorized"));
    }
    throw new ApiError(response.status, data);
  }

  return data as T;
}
