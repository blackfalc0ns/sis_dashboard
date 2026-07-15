import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type {
  DashboardActivityFeedQuery,
  DashboardActivityFeedResponse,
  DashboardAlertsQuery,
  DashboardAlertsResponse,
  DashboardSummaryResponse,
  DashboardModuleListItem,
  DashboardModulePage,
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

export interface FetchLightModeDropdownQuery {
  locale?: string;
  timezone?: string;
  units?: string;
  date?: string;
}

export interface FetchTodosQuery {
  date?: string;
  status?: "pending" | "completed" | "all";
  limit?: number;
  timezone?: string;
}

export interface CreateTodoBody {
  date: string;
  title: string;
  notes?: string | null;
  priority?: "low" | "normal" | "high";
  sortOrder?: number;
}

export interface UpdateTodoBody {
  date?: string;
  title?: string;
  notes?: string | null;
  status?: "pending" | "completed";
  priority?: "low" | "normal" | "high";
  sortOrder?: number;
}

export function fetchLightModeDropdown(query: FetchLightModeDropdownQuery = {}) {
  return fetchDashboardContract<any>(
    `${DASHBOARD_BASE_PATH}/light-mode-dropdown${dashboardQueryString({
      locale: query.locale,
      timezone: query.timezone,
      units: query.units,
      date: query.date,
    })}`,
  );
}

export function fetchDashboardTodos(query: FetchTodosQuery = {}) {
  return fetchDashboardContract<any>(
    `${DASHBOARD_BASE_PATH}/light-mode-dropdown/todos${dashboardQueryString({
      date: query.date,
      status: query.status,
      limit: query.limit,
      timezone: query.timezone,
    })}`,
  );
}

export async function createDashboardTodo(body: CreateTodoBody) {
  const response = await apiPost<any>(
    `${DASHBOARD_BASE_PATH}/light-mode-dropdown/todos`,
    body,
  );
  return unwrapDashboardResponse(response);
}

export async function updateDashboardTodo(todoId: string, body: UpdateTodoBody) {
  const response = await apiPatch<any>(
    `${DASHBOARD_BASE_PATH}/light-mode-dropdown/todos/${todoId}`,
    body,
  );
  return unwrapDashboardResponse(response);
}

export async function deleteDashboardTodo(todoId: string) {
  const response = await apiDelete<any>(
    `${DASHBOARD_BASE_PATH}/light-mode-dropdown/todos/${todoId}`,
  );
  return unwrapDashboardResponse(response);
}

export function fetchDashboardModules() {
  return fetchDashboardContract<DashboardModuleListItem[]>(
    `${DASHBOARD_BASE_PATH}/modules?status=available`,
  );
}

export function fetchDashboardModuleByKey(moduleKey: string) {
  return fetchDashboardContract<DashboardModulePage>(
    `${DASHBOARD_BASE_PATH}/modules/${moduleKey}`,
  );
}
