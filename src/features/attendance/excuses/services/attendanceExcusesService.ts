import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { AttendancePolicy } from "@/features/attendance/policies/types";
import { fetchPolicies } from "@/features/attendance/policies/services/attendancePolicyService";
import {
  getExcusePolicyIssue,
  resolveEffectiveExcuseAttendancePolicy,
} from "../utils/excusePolicyValidation";
import type {
  ExcuseRequest,
  ExcuseRequestFilters,
  ExcuseValidationErrors,
  ExcuseScopeType,
  ExcuseStatus,
} from "../types";
import type { AttendanceScopeIds } from "@/features/attendance/shared/attendanceScope";

type BackendRecord = Record<string, unknown>;

const BASE = "/attendance/excuse-requests";

function asRecord(value: unknown): BackendRecord {
  return value && typeof value === "object" ? (value as BackendRecord) : {};
}

function unwrapArray(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;
  const object = asRecord(response);
  for (const key of ["items", "data", "requests", "excuseRequests"]) {
    if (Array.isArray(object[key])) return object[key] as unknown[];
  }
  return [];
}

function unwrapObject(response: unknown): BackendRecord {
  const object = asRecord(response);
  for (const key of ["request", "excuseRequest", "data"]) {
    const nested = object[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) return nested as BackendRecord;
  }
  return object;
}

function getString(object: BackendRecord, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = object[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return fallback;
}

function getOptionalString(object: BackendRecord, keys: string[]) {
  const value = getString(object, keys);
  return value || undefined;
}

function getNumber(object: BackendRecord, keys: string[]) {
  for (const key of keys) {
    const value = object[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function normalizeStatus(value: unknown): ExcuseStatus {
  return String(value || "PENDING").toUpperCase() as ExcuseStatus;
}

function resolveScopeIds(scopeType: ExcuseScopeType, object: BackendRecord, fallback?: AttendanceScopeIds): AttendanceScopeIds | undefined {
  const nested = object.scopeIds && typeof object.scopeIds === "object" ? (object.scopeIds as AttendanceScopeIds) : undefined;
  if (nested) return nested;

  const scopeKey = getOptionalString(object, ["scopeKey", "scopeId"]);
  if (!scopeKey || scopeKey === "school") return fallback;
  if (scopeType === "CLASSROOM") return { ...fallback, classroomId: scopeKey };
  if (scopeType === "SECTION") return { ...fallback, sectionId: scopeKey };
  if (scopeType === "GRADE") return { ...fallback, gradeId: scopeKey };
  if (scopeType === "STAGE") return { ...fallback, stageId: scopeKey };
  return fallback;
}

function normalizeDateRange(object: BackendRecord) {
  const dateFrom = getString(object, ["dateFrom", "fromDate", "date"], "");
  const dateTo = getString(object, ["dateTo", "toDate", "date"], dateFrom);
  return { dateFrom: dateFrom.slice(0, 10), dateTo: dateTo.slice(0, 10) };
}

function mapAttachments(value: unknown): ExcuseRequest["attachments"] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const object = asRecord(item);
    return {
      id: getString(object, ["id", "fileId", "attachmentId"]),
      name: getString(object, ["name", "filename", "title"]),
      size: getNumber(object, ["size", "sizeBytes"]) || 0,
      type: getString(object, ["type", "mimeType"], "application/octet-stream"),
      url: getOptionalString(object, ["url", "downloadUrl"]),
    };
  });
}

function mapRequest(item: unknown, fallback?: { yearId?: string; termId?: string }): ExcuseRequest {
  const object = unwrapObject(item);
  const scopeType = String(object.scopeType || "SCHOOL").toUpperCase() as ExcuseScopeType;
  const { dateFrom, dateTo } = normalizeDateRange(object);
  const reason = getString(object, ["reason", "reasonEn", "reasonAr"]);

  return {
    id: getString(object, ["id", "requestId", "excuseRequestId"]),
    yearId: getString(object, ["yearId", "academicYearId"], fallback?.yearId || ""),
    termId: getString(object, ["termId"], fallback?.termId || ""),
    studentId: getString(object, ["studentId"]),
    studentNameAr: getString(object, ["studentNameAr", "nameAr", "displayNameAr", "studentNameEn"]),
    studentNameEn: getString(object, ["studentNameEn", "nameEn", "displayNameEn", "studentNameAr"]),
    studentNumber: getOptionalString(object, ["studentNumber", "admissionNo", "studentCode"]),
    scopeType,
    scopeIds: resolveScopeIds(scopeType, object),
    type: String(object.type || "ABSENCE").toUpperCase() as ExcuseRequest["type"],
    dateFrom,
    dateTo,
    selectedPeriodIds: Array.isArray(object.selectedPeriodIds) ? (object.selectedPeriodIds as string[]) : undefined,
    periodIndexes: Array.isArray(object.periodIndexes) ? (object.periodIndexes as number[]) : undefined,
    minutesLate: getNumber(object, ["minutesLate", "lateMinutes"]),
    minutesEarlyLeave: getNumber(object, ["minutesEarlyLeave", "earlyLeaveMinutes"]),
    reasonAr: getString(object, ["reasonAr", "reason"], reason),
    reasonEn: getString(object, ["reasonEn", "reason"], reason),
    attachments: mapAttachments(object.attachments),
    status: normalizeStatus(object.status),
    decisionNote: getOptionalString(object, ["decisionNote", "reviewNote"]),
    decidedAt: getOptionalString(object, ["decidedAt", "reviewedAt"]),
    decidedBy: getOptionalString(object, ["decidedBy", "reviewedBy"]),
    createdAt: getString(object, ["createdAt"], new Date().toISOString()),
    updatedAt: getString(object, ["updatedAt"], new Date().toISOString()),
    linkedSessionIds: Array.isArray(object.linkedSessionIds) ? (object.linkedSessionIds as string[]) : undefined,
  };
}

function buildRequestPayload(payload: Partial<ExcuseRequest>) {
  return {
    academicYearId: payload.yearId,
    termId: payload.termId,
    studentId: payload.studentId,
    type: payload.type,
    dateFrom: payload.dateFrom,
    dateTo: payload.dateTo,
    selectedPeriodIds: payload.selectedPeriodIds,
    selectedPeriodKeys: payload.selectedPeriodIds,
    lateMinutes: payload.minutesLate,
    earlyLeaveMinutes: payload.minutesEarlyLeave,
    reasonAr: payload.reasonAr,
    reasonEn: payload.reasonEn,
  };
}

function buildUpdatePayload(payload: Partial<ExcuseRequest>) {
  return {
    type: payload.type,
    dateFrom: payload.dateFrom,
    dateTo: payload.dateTo,
    selectedPeriodIds: payload.selectedPeriodIds,
    selectedPeriodKeys: payload.selectedPeriodIds,
    lateMinutes: payload.minutesLate,
    earlyLeaveMinutes: payload.minutesEarlyLeave,
    reasonAr: payload.reasonAr,
    reasonEn: payload.reasonEn,
  };
}

async function linkAttachments(requestId: string, attachments?: ExcuseRequest["attachments"]) {
  const fileIds = attachments?.map((attachment) => attachment.id).filter(Boolean) || [];
  if (fileIds.length === 0) return;
  await apiPost(`${BASE}/${requestId}/attachments`, { fileIds });
}

export async function fetchExcuseRequests(
  params: { yearId: string; termId: string } & Partial<ExcuseRequestFilters>
): Promise<ExcuseRequest[]> {
  const response = await apiGet<unknown>(BASE, {
    params: {
      academicYearId: params.yearId,
      termId: params.termId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      status: params.status && params.status !== "ALL" ? params.status : undefined,
      type: params.type && params.type !== "ALL" ? params.type : undefined,
      search: params.search || undefined,
    },
  });

  return unwrapArray(response)
    .map((item) => mapRequest(item, params))
    .filter((request) => {
      if (params.hasAttachment === "YES") return (request.attachments?.length || 0) > 0;
      if (params.hasAttachment === "NO") return (request.attachments?.length || 0) === 0;
      return true;
    });
}

export async function createExcuseRequest(
  payload: Omit<
    ExcuseRequest,
    "id" | "status" | "createdAt" | "updatedAt" | "decidedAt" | "decidedBy" | "decisionNote" | "linkedSessionIds"
  >
): Promise<ExcuseRequest> {
  const response = await apiPost<unknown>(BASE, buildRequestPayload(payload));
  const request = mapRequest(response, { yearId: payload.yearId, termId: payload.termId });
  await linkAttachments(request.id, payload.attachments);
  return request;
}

export async function updateExcuseRequest(
  id: string,
  payload: Partial<Omit<ExcuseRequest, "id" | "yearId" | "termId" | "createdAt" | "status" | "decidedAt" | "decidedBy">>
): Promise<ExcuseRequest> {
  const response = await apiPatch<unknown>(`${BASE}/${id}`, buildUpdatePayload(payload));
  await linkAttachments(id, payload.attachments);
  return mapRequest(response);
}

export async function deleteExcuseRequest(id: string): Promise<void> {
  await apiDelete(`${BASE}/${id}`);
}

export async function approveExcuseRequest(id: string, decisionNote?: string, _decidedBy?: string) {
  const response = await apiPost<unknown>(`${BASE}/${id}/approve`, { decisionNote });
  return mapRequest(response);
}

export async function rejectExcuseRequest(id: string, decisionNote?: string, _decidedBy?: string) {
  const response = await apiPost<unknown>(`${BASE}/${id}/reject`, { decisionNote });
  return mapRequest(response);
}

export async function validateExcuseRequest(
  payload: Partial<ExcuseRequest>,
  effectivePolicy: AttendancePolicy | null,
  termRange: { startDate: string; endDate: string }
): Promise<ExcuseValidationErrors> {
  const errors: ExcuseValidationErrors = {};

  if (!payload.studentId) errors.studentId = "Student is required";
  if (!payload.type) errors.type = "Type is required";
  if (!payload.dateFrom) errors.dateFrom = "Start date is required";
  if (!payload.dateTo) errors.dateTo = "End date is required";
  if (payload.dateFrom && payload.dateTo && payload.dateFrom > payload.dateTo) {
    errors.dateTo = "End date must be after start date";
  }
  if (payload.dateFrom && (payload.dateFrom < termRange.startDate || payload.dateFrom > termRange.endDate)) {
    errors.dateFrom = "Date must be within term range";
  }
  if (payload.dateTo && (payload.dateTo < termRange.startDate || payload.dateTo > termRange.endDate)) {
    errors.dateTo = "Date must be within term range";
  }

  const reasonAr = payload.reasonAr?.trim() || "";
  const reasonEn = payload.reasonEn?.trim() || "";
  if (effectivePolicy?.requireExcuseReason && !reasonAr && !reasonEn) {
    errors.reason = "At least one reason language is required";
  }

  if (payload.type === "LATE" || payload.type === "EARLY_LEAVE") {
    const hasPeriods = (payload.selectedPeriodIds && payload.selectedPeriodIds.length > 0) ||
      (payload.periodIndexes && payload.periodIndexes.length > 0);
    if (!hasPeriods) errors.selectedPeriodIds = "Period selection is required for late/early leave requests";
  }

  if (payload.type === "LATE") {
    if (payload.minutesLate === undefined || payload.minutesLate === null) {
      errors.minutesLate = "Minutes late is required";
    } else if (payload.minutesLate <= 0) {
      errors.minutesLate = "Minutes late must be greater than 0";
    }
  }

  if (payload.type === "EARLY_LEAVE") {
    if (payload.minutesEarlyLeave === undefined || payload.minutesEarlyLeave === null) {
      errors.minutesEarlyLeave = "Minutes early leave is required";
    } else if (payload.minutesEarlyLeave <= 0) {
      errors.minutesEarlyLeave = "Minutes early leave must be greater than 0";
    }
  }

  if (effectivePolicy && !effectivePolicy.allowExcuses) {
    errors.policy = "Excuses are disabled by policy";
  }
  if (effectivePolicy?.requireAttachmentForExcuse && (payload.attachments?.length || 0) === 0) {
    errors.attachments = "Attachment is required by policy";
  }

  return errors;
}

export async function validateExcusePolicyRange(
  payload: Pick<ExcuseRequest, "yearId" | "termId" | "dateFrom" | "dateTo" | "scopeType" | "scopeIds" | "attachments" | "reasonAr" | "reasonEn">
) {
  const policies = await fetchPolicies(payload.yearId, payload.termId);
  return getExcusePolicyIssue(payload, policies);
}

export async function resolveRequestPolicy(
  yearId: string,
  termId: string,
  scopeType: ExcuseScopeType,
  scopeIds: AttendanceScopeIds | undefined,
  date: string
): Promise<AttendancePolicy | null> {
  const policies = await fetchPolicies(yearId, termId);
  return resolveEffectiveExcuseAttendancePolicy(policies, date, scopeType, scopeIds);
}
