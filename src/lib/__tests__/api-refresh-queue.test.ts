import { beforeEach, describe, expect, it, vi } from "vitest";

type InterceptorFulfilled = (value: Record<string, unknown>) => unknown;
type InterceptorRejected = (error: Record<string, unknown>) => unknown;

const axiosMocks = vi.hoisted(() => {
  const state: {
    requestFulfilled?: InterceptorFulfilled;
    responseFulfilled?: InterceptorFulfilled;
    responseRejected?: InterceptorRejected;
    retriedRequests: Array<Record<string, unknown>>;
  } = {
    retriedRequests: [],
  };

  const refreshPost = vi.fn();

  const request = vi.fn(async (inputConfig: Record<string, unknown>) => {
    const config = {
      headers: {},
      ...inputConfig,
    };
    const nextConfig =
      (await state.requestFulfilled?.(config)) ?? config;

    if (nextConfig._retry) {
      state.retriedRequests.push(nextConfig);
      return state.responseFulfilled?.({
        config: nextConfig,
        data: { ok: true },
      }) ?? { config: nextConfig, data: { ok: true } };
    }

    const error = {
      config: nextConfig,
      isAxiosError: true,
      message: "Unauthorized",
      response: {
        data: { message: "Unauthorized" },
        status: 401,
      },
    };

    return state.responseRejected?.(error);
  });

  const instance = Object.assign(
    vi.fn((config: Record<string, unknown>) => request(config)),
    {
      get: vi.fn((url: string, config?: Record<string, unknown>) =>
        request({ ...config, headers: {}, method: "get", url }),
      ),
      interceptors: {
        request: {
          use: vi.fn((fulfilled: InterceptorFulfilled) => {
            state.requestFulfilled = fulfilled;
          }),
        },
        response: {
          use: vi.fn(
            (
              fulfilled: InterceptorFulfilled,
              rejected: InterceptorRejected,
            ) => {
              state.responseFulfilled = fulfilled;
              state.responseRejected = rejected;
            },
          ),
        },
      },
    },
  );

  const axios = Object.assign(
    vi.fn((config: Record<string, unknown>) => request(config)),
    {
      create: vi.fn(() => instance),
      isAxiosError: vi.fn(
        (error: Record<string, unknown>) => Boolean(error?.isAxiosError),
      ),
      post: refreshPost,
    },
  );

  return { axios, refreshPost, state };
});

vi.mock("axios", () => ({
  default: axiosMocks.axios,
}));

describe("api refresh queue", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_API_URL = "https://api.test/api/v1";
    localStorage.clear();
    axiosMocks.refreshPost.mockReset();
    axiosMocks.state.requestFulfilled = undefined;
    axiosMocks.state.responseFulfilled = undefined;
    axiosMocks.state.responseRejected = undefined;
    axiosMocks.state.retriedRequests = [];
  });

  it("shares one refresh request across simultaneous 401 responses and retries all requests", async () => {
    localStorage.setItem("moazez_refresh_token", "old-refresh-token");
    axiosMocks.refreshPost.mockResolvedValue({
      data: {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      },
    });

    const { apiGet } = await import("../api");

    const results = await Promise.all(
      Array.from({ length: 5 }, (_, index) => apiGet(`/resource-${index}`)),
    );

    expect(axiosMocks.refreshPost).toHaveBeenCalledTimes(1);
    expect(axiosMocks.refreshPost).toHaveBeenCalledWith(
      "https://api.test/api/v1/auth/refresh",
      { refreshToken: "old-refresh-token" },
      { withCredentials: true },
    );
    expect(results).toEqual(Array.from({ length: 5 }, () => ({ ok: true })));
    expect(axiosMocks.state.retriedRequests).toHaveLength(5);
    expect(
      axiosMocks.state.retriedRequests.every(
        (requestConfig) =>
          (requestConfig.headers as Record<string, unknown>).Authorization ===
          "Bearer new-access-token",
      ),
    ).toBe(true);
    expect(localStorage.getItem("moazez_access_token")).toBe(
      "new-access-token",
    );
    expect(localStorage.getItem("moazez_refresh_token")).toBe(
      "new-refresh-token",
    );
  });

  it("rejects all waiting requests and clears tokens when refresh fails", async () => {
    localStorage.setItem("moazez_access_token", "old-access-token");
    localStorage.setItem("moazez_refresh_token", "old-refresh-token");
    axiosMocks.refreshPost.mockRejectedValue({
      isAxiosError: true,
      message: "Refresh failed",
      response: {
        data: { message: "Refresh failed" },
        status: 401,
      },
    });

    const { apiGet } = await import("../api");

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, (_, index) => apiGet(`/resource-${index}`)),
    );

    expect(axiosMocks.refreshPost).toHaveBeenCalledTimes(1);
    expect(results.every((result) => result.status === "rejected")).toBe(true);
    expect(localStorage.getItem("moazez_access_token")).toBeNull();
    expect(localStorage.getItem("moazez_refresh_token")).toBeNull();
    expect(axiosMocks.state.retriedRequests).toHaveLength(0);
  });

  it("attempts refresh without a stored refresh token for cookie-based auth", async () => {
    axiosMocks.refreshPost.mockResolvedValue({
      data: {
        accessToken: "cookie-access-token",
      },
    });

    const { apiGet } = await import("../api");

    await expect(apiGet("/resource")).resolves.toEqual({ ok: true });

    expect(axiosMocks.refreshPost).toHaveBeenCalledWith(
      "https://api.test/api/v1/auth/refresh",
      undefined,
      { withCredentials: true },
    );
    expect(localStorage.getItem("moazez_access_token")).toBe(
      "cookie-access-token",
    );
  });

  it("does not refresh again when the failed request is already the refresh endpoint", async () => {
    localStorage.setItem("moazez_refresh_token", "old-refresh-token");

    const { apiGet } = await import("../api");

    await expect(apiGet("/auth/refresh")).rejects.toThrow();

    expect(axiosMocks.refreshPost).not.toHaveBeenCalled();
    expect(localStorage.getItem("moazez_refresh_token")).toBeNull();
  });

  it("throws a clear error when NEXT_PUBLIC_API_URL is missing", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_API_URL = "";

    await expect(import("../api")).rejects.toThrow(
      "Missing NEXT_PUBLIC_API_URL. Set it in your environment.",
    );
  });
});
