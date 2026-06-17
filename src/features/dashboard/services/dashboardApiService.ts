import { apiGet } from "@/lib/api";
import type {
  DashboardActivityFeedQuery,
  DashboardActivityFeedResponse,
  DashboardAlertsQuery,
  DashboardAlertsResponse,
  DashboardSummaryResponse,
} from "@/features/dashboard/types/dashboardApi.types";

interface DashboardApiEnvelope<T> {
  data?: T;
  error?: string;
  message?: string;
}

type QueryPrimitive = string | number | boolean | null | undefined;

const DASHBOARD_BASE_PATH = "/dashboard";

export function dashboardQueryString(
  queryParameters: Record<string, QueryPrimitive>,
) {
  const searchParameters = new URLSearchParams();

  Object.entries(queryParameters).forEach(([parameterName, parameterValue]) => {
    if (parameterValue === null || typeof parameterValue === "undefined") {
      return;
    }

    const normalizedParameterValue = String(parameterValue).trim();
    if (normalizedParameterValue) {
      searchParameters.set(parameterName, normalizedParameterValue);
    }
  });

  const queryString = searchParameters.toString();
  return queryString ? `?${queryString}` : "";
}

function unwrapDashboardResponse<T>(
  responsePayload: DashboardApiEnvelope<T> | T,
): T {
  if (!isDashboardEnvelope(responsePayload)) {
    return responsePayload;
  }

  if (responsePayload.error) {
    throw new Error(responsePayload.error);
  }

  if (typeof responsePayload.data === "undefined") {
    throw new Error(responsePayload.message || "Missing dashboard response data");
  }

  return responsePayload.data;
}

function isDashboardEnvelope<T>(
  responsePayload: DashboardApiEnvelope<T> | T,
): responsePayload is DashboardApiEnvelope<T> {
  return (
    !!responsePayload &&
    typeof responsePayload === "object" &&
    ("data" in responsePayload ||
      "error" in responsePayload ||
      "message" in responsePayload)
  );
}

async function fetchDashboardContract<T>(endpoint: string): Promise<T> {
  const responsePayload = await apiGet<DashboardApiEnvelope<T> | T>(endpoint);
  return unwrapDashboardResponse(responsePayload);
}

export function fetchDashboardSummary() {
  return fetchDashboardContract<DashboardSummaryResponse>(
    `${DASHBOARD_BASE_PATH}/summary`,
  );
}

export function fetchDashboardAlerts(query: DashboardAlertsQuery = {}) {
  return fetchDashboardContract<DashboardAlertsResponse>(
    `${DASHBOARD_BASE_PATH}/alerts${dashboardQueryString({
      source: query.source,
      severity: query.severity,
      limit: query.limit,
      includeZeroCount: query.includeZeroCount,
    })}`,
  );
}

export function fetchDashboardActivityFeed(
  query: DashboardActivityFeedQuery = {},
) {
  return fetchDashboardContract<DashboardActivityFeedResponse>(
    `${DASHBOARD_BASE_PATH}/activity-feed${dashboardQueryString({
      source: query.source,
      eventType: query.eventType,
      actorType: query.actorType,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      limit: query.limit,
      cursor: query.cursor,
    })}`,
  );
}
