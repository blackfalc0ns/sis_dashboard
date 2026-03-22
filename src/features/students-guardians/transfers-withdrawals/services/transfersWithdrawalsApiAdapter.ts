import { apiWithToken } from "@/lib/api";
import type { TransfersWithdrawalsAdapter } from "@/features/students-guardians/transfers-withdrawals/services/transfersWithdrawalsAdapter";
import type {
  ApplicationStatus,
  Stage,
  TransferApplication,
  WithdrawalApplication,
} from "@/features/students-guardians/transfers-withdrawals/types/transfers-withdrawals";

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

export const createTransfersWithdrawalsApiAdapter = (
  basePath: string = "/students-guardians/transfers-withdrawals",
): TransfersWithdrawalsAdapter => ({
  getAllTransfers: () => {
    throw new Error("transfers_api_sync_not_supported");
  },
  getAllWithdrawals: () => {
    throw new Error("transfers_api_sync_not_supported");
  },
  subscribe: () => () => undefined,
  getSnapshot: () => 0,
  getTransferById: () => {
    throw new Error("transfers_api_sync_not_supported");
  },
  getWithdrawalById: () => {
    throw new Error("transfers_api_sync_not_supported");
  },
  getTransfersByStudentId: () => {
    throw new Error("transfers_api_sync_not_supported");
  },
  getWithdrawalsByStudentId: () => {
    throw new Error("transfers_api_sync_not_supported");
  },
  filterTransfers: () => {
    throw new Error("transfers_api_sync_not_supported");
  },
  filterWithdrawals: () => {
    throw new Error("transfers_api_sync_not_supported");
  },
  createTransfer: (data) =>
    unwrap<TransferApplication>(
      apiWithToken(`${basePath}/transfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    ),
  createWithdrawal: (data) =>
    unwrap<WithdrawalApplication>(
      apiWithToken(`${basePath}/withdrawals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    ),
  updateTransferStatus: (id, status: ApplicationStatus, rejectionReason?: string) =>
    unwrap<TransferApplication>(
      apiWithToken(`${basePath}/transfers/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason }),
      }),
    ),
  updateWithdrawalStatus: (id, status: ApplicationStatus, rejectionReason?: string) =>
    unwrap<WithdrawalApplication>(
      apiWithToken(`${basePath}/withdrawals/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason }),
      }),
    ),
  getOverviewMetrics: () => {
    throw new Error("transfers_api_sync_not_supported");
  },
  getTrendData: () => {
    throw new Error("transfers_api_sync_not_supported");
  },
  getStageBreakdown: () => {
    throw new Error("transfers_api_sync_not_supported");
  },
  getWithdrawalReasons: () => {
    throw new Error("transfers_api_sync_not_supported");
  },
  getWithdrawalsByBehaviorBand: () => {
    throw new Error("transfers_api_sync_not_supported");
  },
  getRequestsTableRows: () => {
    throw new Error("transfers_api_sync_not_supported");
  },
  fetchOverviewMetrics: () =>
    unwrap(apiWithToken(`${basePath}/analytics/overview`, { method: "GET" })),
  fetchTrendData: (stage: Stage | "all" = "all") =>
    unwrap(
      apiWithToken(`${basePath}/analytics/trend${buildQuery({ stage })}`, {
        method: "GET",
      }),
    ),
  fetchStageBreakdown: () =>
    unwrap(apiWithToken(`${basePath}/analytics/stage-breakdown`, { method: "GET" })),
  fetchWithdrawalReasons: (stage: Stage | "all" = "all") =>
    unwrap(
      apiWithToken(`${basePath}/analytics/withdrawal-reasons${buildQuery({ stage })}`, {
        method: "GET",
      }),
    ),
  fetchWithdrawalsByBehaviorBand: () =>
    unwrap(apiWithToken(`${basePath}/analytics/behavior-breakdown`, { method: "GET" })),
  fetchRequestsTableRows: () =>
    unwrap(apiWithToken(`${basePath}/analytics/request-rows`, { method: "GET" })),
});

export const transfersWithdrawalsApiAdapter =
  createTransfersWithdrawalsApiAdapter();
