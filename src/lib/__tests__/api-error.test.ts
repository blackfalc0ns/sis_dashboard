import { describe, expect, it } from "vitest";
import type { AxiosError } from "axios";
import { ApiError } from "@/lib/api-error";

describe("ApiError", () => {
  it("preserves backend validation envelope fields without mixing metadata", () => {
    const axiosError = {
      message: "Request failed",
      response: {
        status: 400,
        data: {
          error: {
            code: "validation.failed",
            message: "Validation failed",
            details: { field: "scopeType" },
            traceId: "trace-123",
          },
        },
      },
    } as AxiosError;

    const apiError = ApiError.fromAxiosError(axiosError);

    expect(apiError.code).toBe("validation.failed");
    expect(apiError.message).toBe("Validation failed");
    expect(apiError.details).toEqual({ field: "scopeType" });
    expect(apiError.traceId).toBe("trace-123");
  });
});
