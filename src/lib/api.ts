import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { tokenStorage } from "./token-storage";
import { ApiError, isAxiosError } from "./api-error";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.moazez.sa/api/v1";

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Variables to handle token refresh process
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Helper functions for the refresh queue
function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// Request interceptor: Attach access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor: Handle errors & auto-refresh token on 401
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop if the refresh token call itself fails with 401
      if (originalRequest.url?.includes("/auth/refresh")) {
        tokenStorage.clearTokens();
        // Redirect to login handled by AuthProvider or App logic, returning error
        return Promise.reject(ApiError.fromAxiosError(error));
      }

      originalRequest._retry = true;

      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        tokenStorage.clearTokens();
        // Redirect will happen in Auth context
        return Promise.reject(ApiError.fromAxiosError(error));
      }

      if (isRefreshing) {
        // Queue the request until refresh completes
        try {
          const token = await new Promise<string>((resolve) => {
            subscribeTokenRefresh((newToken: string) => {
              resolve(newToken);
            });
          });
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      isRefreshing = true;

      try {
        // We use axios directly here to avoid interceptors for the refresh call
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        tokenStorage.setAccessToken(accessToken);
        tokenStorage.setRefreshToken(newRefreshToken);

        isRefreshing = false;
        onRefreshed(accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        tokenStorage.clearTokens();

        if (isAxiosError(refreshError)) {
          return Promise.reject(ApiError.fromAxiosError(refreshError));
        }
        return Promise.reject(refreshError);
      }
    }

    // Wrap any other error in our ApiError class
    if (isAxiosError(error)) {
      return Promise.reject(ApiError.fromAxiosError(error));
    }

    return Promise.reject(error);
  },
);

// Generic wrapper functions
export async function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.get<T>(url, config);
  return response.data;
}

export async function apiPost<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
}

export async function apiPut<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
}

export async function apiPatch<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.patch<T>(url, data, config);
  return response.data;
}

export async function apiDelete<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
}

// Deprecated: For backwards compatibility, to be gradually replaced
export async function api<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  console.warn(
    "Using deprecated api() fetch wrapper. Please migrate to apiClient or apiGet/apiPost.",
  );
  // simplistic fallback for old code
  if (options?.method === "POST") {
    return apiPost<T>(
      endpoint,
      options.body ? JSON.parse(options.body as string) : undefined,
    );
  }
  return apiGet<T>(endpoint);
}

export async function apiWithToken<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  console.warn(
    "Using deprecated apiWithToken() fetch wrapper. Please migrate to apiClient or apiGet/apiPost.",
  );
  if (options?.method === "POST") {
    return apiPost<T>(
      endpoint,
      options.body ? JSON.parse(options.body as string) : undefined,
    );
  }
  return apiGet<T>(endpoint);
}
