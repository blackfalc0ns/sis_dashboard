// FILE: src/lib/api-error.ts
import axios, { AxiosError } from "axios";

export class ApiError extends Error {
  status: number;
  code: string;
  errors?: Record<string, string[]>;
  details?: unknown;
  traceId?: string;

  constructor(
    message: string,
    status: number,
    code: string = "UNKNOWN_ERROR",
    errors?: Record<string, string[]>,
    details?: unknown,
    traceId?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.details = details;
    this.traceId = traceId;
  }

  static fromAxiosError(error: AxiosError<any>): ApiError {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      const data = error.response.data as any;
      const payload = data?.error ?? data;

      let message =
        payload?.message || payload?.error || data?.message || error.message || "An error occurred";
      const code = payload?.code || data?.code || "API_ERROR";
      const errors = payload?.errors || data?.errors;
      const details = payload?.details || data?.details;
      const traceId = payload?.traceId || data?.traceId;

      const detailMessages: string[] = [];
      if (details && typeof details === "object") {
        Object.values(details).forEach((val) => {
          if (Array.isArray(val)) {
            detailMessages.push(...val.filter((v) => typeof v === "string"));
          } else if (typeof val === "string") {
            detailMessages.push(val);
          }
        });
      }

      if (detailMessages.length > 0) {
        const uniqueMessages = detailMessages.filter(
          (msg) => msg !== message && msg.trim() !== "",
        );
        if (uniqueMessages.length > 0) {
          if (!message || message === "An error occurred" || message === "Validation failed") {
            message = uniqueMessages.join(", ");
          } else {
            message = `${message}: ${uniqueMessages.join(", ")}`;
          }
        }
      }

      return new ApiError(message, status, code, errors, details, traceId);
    } else if (error.request) {
      // The request was made but no response was received
      return ApiError.network();
    } else {
      // Something happened in setting up the request that triggered an Error
      return new ApiError(error.message, 0, "REQUEST_SETUP_ERROR");
    }
  }

  static network(): ApiError {
    return new ApiError(
      "Network error. Please check your connection.",
      0,
      "NETWORK_ERROR",
    );
  }

  static unauthorized(message = "Unauthorized"): ApiError {
    return new ApiError(message, 401, "UNAUTHORIZED");
  }

  isNetworkError(): boolean {
    return this.status === 0;
  }

  isValidationError(): boolean {
    return this.status === 422 || this.status === 400;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isAxiosError(error: unknown): error is AxiosError {
    return axios.isAxiosError(error);
}
