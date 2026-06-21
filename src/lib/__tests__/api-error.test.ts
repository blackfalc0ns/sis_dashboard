import { describe, expect, it } from "vitest";
import type { AxiosError } from "axios";
import { ApiError } from "@/lib/api-error";

describe("ApiError", () => {
  it("preserves backend messages, details, and trace ids without mixing metadata", () => {
    const axiosError = {
      message: "Request failed",
      response: {
        status: 409,
        data: {
          error: {
            code: "academics.allocation.duplicate",
            message: "Allocation already exists",
            details: { classroomId: "classroom-1" },
            traceId: "trace-123",
          },
        },
      },
    } as AxiosError;

    const apiError = ApiError.fromAxiosError(axiosError);

    expect(apiError.code).toBe("academics.allocation.duplicate");
    expect(apiError.message).toBe("Allocation already exists");
    expect(apiError.details).toEqual({ classroomId: "classroom-1" });
    expect(apiError.traceId).toBe("trace-123");
  });
});
