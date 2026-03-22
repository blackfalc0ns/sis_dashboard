import { apiWithToken } from "@/lib/api";
import type { OverviewAdapter } from "@/features/academics/overview/services/overviewAdapter";
import type { OverviewMetrics } from "@/features/academics/overview/services/overviewService";

interface ApiEnvelope<T> {
  data?: T;
  error?: string;
  message?: string;
}

const unwrap = async <T>(request: Promise<ApiEnvelope<T> | T>): Promise<T> => {
  const response = await request;

  if (
    response &&
    typeof response === "object" &&
    ("data" in response || "error" in response || "message" in response)
  ) {
    const envelope = response as ApiEnvelope<T>;
    if (envelope.error) {
      throw new Error(envelope.error);
    }
    if (typeof envelope.data === "undefined") {
      throw new Error(envelope.message || "Missing API response data");
    }
    return envelope.data;
  }

  return response as T;
};

const buildQuery = (params: Record<string, string>) => {
  const search = new URLSearchParams(params);
  return `?${search.toString()}`;
};

export const createOverviewApiAdapter = (
  basePath: string = "/academics/overview"
): OverviewAdapter => ({
  async fetchOverviewMetrics(yearId, termId) {
    return unwrap<OverviewMetrics>(
      apiWithToken(`${basePath}/metrics${buildQuery({ yearId, termId })}`, {
        method: "GET",
      })
    );
  },
});

export const overviewApiAdapter = createOverviewApiAdapter();
