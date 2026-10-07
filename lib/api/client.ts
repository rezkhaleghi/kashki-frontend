import { dispatchToast } from "@/lib/toasts";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

function successMessage(path: string, method: string, data: unknown) {
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof data.message === "string"
  ) {
    return data.message;
  }

  if (path === "/gifts") return "Gift sent successfully.";
  if (path === "/auth/request-otp") return "Verification code sent.";
  if (method === "DELETE") return "Deleted successfully.";
  if (method === "PATCH" || method === "PUT")
    return "Changes saved successfully.";
  return "Completed successfully.";
}

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
          ? data.message
              .filter((item): item is string => typeof item === "string")
              .join(", ")
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
  const method = (options.method ?? "GET").toUpperCase();

  try {
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
      if (method !== "GET" && method !== "HEAD") {
        dispatchToast("success", successMessage(path, method, undefined));
      }
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

      const error = new ApiError(response.status, data);
      const expectedGuestCheck =
        response.status === 401 && method === "GET" && path === "/users/me";
      if (!expectedGuestCheck) dispatchToast("error", error.message);
      throw error;
    }

    if (method !== "GET" && method !== "HEAD") {
      dispatchToast("success", successMessage(path, method, data));
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    dispatchToast(
      "error",
      "Could not connect to Kashki. Check your connection and try again.",
    );
    throw error;
  }
}
