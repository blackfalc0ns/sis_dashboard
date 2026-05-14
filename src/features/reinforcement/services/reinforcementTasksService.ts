import { apiGet, apiPost } from "@/lib/api";
import type {
  CancelReinforcementTaskPayload,
  CreateReinforcementTaskPayload,
  DuplicateReinforcementTaskPayload,
  ListReinforcementTasksParams,
  ListReinforcementTasksResponse,
  ReinforcementTask,
} from "../types";
import {
  buildReinforcementQueryString,
  unwrapReinforcementItemResponse,
  unwrapReinforcementListResponse,
} from "./reinforcementApiUtils";

const TASKS_ENDPOINT = "/reinforcement/tasks";

export async function listReinforcementTasks(
  params?: ListReinforcementTasksParams,
): Promise<ListReinforcementTasksResponse> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(`${TASKS_ENDPOINT}${query}`);
  return unwrapReinforcementListResponse<ReinforcementTask>(response);
}

export async function createReinforcementTask(
  payload: CreateReinforcementTaskPayload,
): Promise<ReinforcementTask> {
  const response = await apiPost<unknown>(TASKS_ENDPOINT, payload);
  return unwrapReinforcementItemResponse<ReinforcementTask>(response);
}

export async function getReinforcementTask(
  taskId: string,
): Promise<ReinforcementTask> {
  const response = await apiGet<unknown>(`${TASKS_ENDPOINT}/${taskId}`);
  return unwrapReinforcementItemResponse<ReinforcementTask>(response);
}

export async function duplicateReinforcementTask(
  taskId: string,
  payload: DuplicateReinforcementTaskPayload,
): Promise<ReinforcementTask> {
  const response = await apiPost<unknown>(
    `${TASKS_ENDPOINT}/${taskId}/duplicate`,
    payload,
  );
  return unwrapReinforcementItemResponse<ReinforcementTask>(response);
}

export async function cancelReinforcementTask(
  taskId: string,
  payload: CancelReinforcementTaskPayload,
): Promise<ReinforcementTask> {
  const response = await apiPost<unknown>(
    `${TASKS_ENDPOINT}/${taskId}/cancel`,
    payload,
  );
  return unwrapReinforcementItemResponse<ReinforcementTask>(response);
}
