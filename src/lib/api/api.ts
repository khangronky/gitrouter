
import axios, { AxiosError } from "axios";


interface ErrorWithInfo extends Error {
  info: unknown;
  status: number;
}


interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: string;
  headers?: Record<string, string>;
  requireAuth?: boolean; // Default true
}

// ====================
// Shared Axios Instance with 401 Interceptor
// ====================

const apiClient = axios.create({
  baseURL: "/api",
  timeout: 300000, // 5 minutes
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // IMPORTANT: Enable cookies for all requests
});


// ====================
// Fetcher Function using Shared Instance
// ====================

async function fetcher<T = unknown>(
  url: string,
  options?: FetchOptions,
): Promise<T> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options?.headers,
    };

    const config = {
      method: options?.method || "GET",
      url: url,
      data: options?.body,
      headers,
    };

    const response = await apiClient<T>(config);

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const customError = new Error(
        "An error occurred while fetching the data",
      ) as ErrorWithInfo;
      customError.info = error.response.data;
      customError.status = error.response.status;

      throw customError;
    }
    throw error;
  }
}

export { fetcher, apiClient, type FetchOptions };
