const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const API_BASE_URL = BASE_URL;

export type ApiRequestOptions = RequestInit & {
  timeout?: number;
};

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { timeout = 15000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      let message = `Request failed with status ${response.status}`;

      try {
        const errorData = await response.json();

        if (errorData?.detail) {
          message =
            typeof errorData.detail === "string"
              ? errorData.detail
              : JSON.stringify(errorData.detail);
        }
      } catch {
        // Keep default error message.
      }

      throw new Error(message);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Backend request timed out.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function apiGet<T>(endpoint: string) {
  return apiRequest<T>(endpoint, {
    method: "GET",
  });
}

export function apiPost<T>(
  endpoint: string,
  body?: unknown
) {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}