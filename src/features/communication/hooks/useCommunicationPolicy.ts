"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getAdminOverview,
  getPolicy,
  updatePolicy,
} from "@/features/communication/api/communication.service";
import type {
  CommunicationAdminOverview,
  CommunicationPolicy,
  CommunicationRecord,
  UpdateCommunicationPolicyPayload,
} from "@/features/communication/types/communication.types";

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

let cachedPolicy: CommunicationPolicy | null = null;
const policyListeners = new Set<(policy: CommunicationPolicy | null) => void>();

function notifyPolicyListeners(policy: CommunicationPolicy | null) {
  cachedPolicy = policy;
  policyListeners.forEach((listener) => listener(policy));
}

function unwrapItem<T>(response: unknown): T | null {
  if (!isRecord(response)) return (response ?? null) as T | null;
  const item = [response.data, response.item, response.result, response.payload].find(
    (candidate) => isRecord(candidate) && !Array.isArray(candidate),
  );
  return (item ?? response) as T;
}

function errorMessageFromUnknown(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unable to load communication policy.";
}

function parseMetadata(metadataText?: string): CommunicationRecord | undefined {
  const trimmed = metadataText?.trim();
  if (!trimmed) return undefined;
  const parsed = JSON.parse(trimmed) as unknown;
  if (!isRecord(parsed)) throw new Error("Metadata must be a JSON object.");
  return parsed;
}

export interface CommunicationPolicyFormValues {
  isEnabled?: boolean;
  allowAdminToAnyone?: boolean;
  allowDirectStaffToStaff?: boolean;
  allowTeacherCreatedGroups?: boolean;
  allowAttachments?: boolean;
  allowReactions?: boolean;
  allowMessageEdit?: boolean;
  allowMessageDelete?: boolean;
  allowReadReceipts?: boolean;
  allowDeliveryReceipts?: boolean;
  maxGroupMembers?: string;
  maxMessageLength?: string;
  maxAttachmentSizeMb?: string;
  moderationMode?: string;
  metadataText?: string;
}

export function policyToFormValues(
  policy: CommunicationPolicy | null,
): CommunicationPolicyFormValues {
  return {
    isEnabled: policy?.isEnabled ?? policy?.allowConversations ?? true,
    allowAdminToAnyone: policy?.allowAdminToAnyone ?? false,
    allowDirectStaffToStaff: policy?.allowDirectStaffToStaff ?? true,
    allowTeacherCreatedGroups: policy?.allowTeacherCreatedGroups ?? true,
    allowAttachments: policy?.allowAttachments ?? true,
    allowReactions: policy?.allowReactions ?? true,
    allowMessageEdit:
      policy?.allowMessageEdit ?? policy?.allowMessageEditing ?? true,
    allowMessageDelete:
      policy?.allowMessageDelete ?? policy?.allowMessageDeleting ?? true,
    allowReadReceipts: policy?.allowReadReceipts ?? true,
    allowDeliveryReceipts: policy?.allowDeliveryReceipts ?? true,
    maxGroupMembers:
      typeof policy?.maxGroupMembers === "number"
        ? String(policy.maxGroupMembers)
        : "",
    maxMessageLength:
      typeof policy?.maxMessageLength === "number"
        ? String(policy.maxMessageLength)
        : "",
    maxAttachmentSizeMb:
      typeof policy?.maxAttachmentSizeMb === "number"
        ? String(policy.maxAttachmentSizeMb)
        : "",
    moderationMode: policy?.moderationMode ?? "manual",
    metadataText: policy?.metadata ? JSON.stringify(policy.metadata, null, 2) : "",
  };
}

function optionalNumber(value?: string): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function payloadFromValues(
  values: CommunicationPolicyFormValues,
): UpdateCommunicationPolicyPayload {
  const metadata = parseMetadata(values.metadataText);
  const allowMessageEdit = Boolean(values.allowMessageEdit);
  const allowMessageDelete = Boolean(values.allowMessageDelete);

  return {
    isEnabled: Boolean(values.isEnabled),
    allowAdminToAnyone: Boolean(values.allowAdminToAnyone),
    allowDirectStaffToStaff: Boolean(values.allowDirectStaffToStaff),
    allowTeacherCreatedGroups: Boolean(values.allowTeacherCreatedGroups),
    allowAttachments: Boolean(values.allowAttachments),
    allowReactions: Boolean(values.allowReactions),
    allowMessageEdit,
    allowMessageDelete,
    allowMessageEditing: allowMessageEdit,
    allowMessageDeleting: allowMessageDelete,
    allowReadReceipts: Boolean(values.allowReadReceipts),
    allowDeliveryReceipts: Boolean(values.allowDeliveryReceipts),
    moderationMode: values.moderationMode || "manual",
    ...(optionalNumber(values.maxGroupMembers)
      ? { maxGroupMembers: optionalNumber(values.maxGroupMembers) }
      : {}),
    ...(optionalNumber(values.maxMessageLength)
      ? { maxMessageLength: optionalNumber(values.maxMessageLength) }
      : {}),
    ...(optionalNumber(values.maxAttachmentSizeMb)
      ? { maxAttachmentSizeMb: optionalNumber(values.maxAttachmentSizeMb) }
      : {}),
    ...(metadata ? { metadata } : {}),
  };
}

export function useCommunicationPolicy() {
  const mountedRef = useRef(false);
  const [policy, setPolicy] = useState<CommunicationPolicy | null>(cachedPolicy);
  const [adminOverview, setAdminOverview] =
    useState<CommunicationAdminOverview | null>(null);
  const [isLoading, setIsLoading] = useState(!cachedPolicy);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const [policyResponse, overviewResponse] = await Promise.all([
        getPolicy(),
        getAdminOverview(),
      ]);
      const nextPolicy = unwrapItem<CommunicationPolicy>(policyResponse);
      const nextOverview =
        unwrapItem<CommunicationAdminOverview>(overviewResponse);

      if (!mountedRef.current) return;
      notifyPolicyListeners(nextPolicy);
      setAdminOverview(nextOverview);
    } catch (nextError) {
      if (mountedRef.current) setError(errorMessageFromUnknown(nextError));
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const listener = (nextPolicy: CommunicationPolicy | null) => {
      if (mountedRef.current) setPolicy(nextPolicy);
    };
    policyListeners.add(listener);
    if (!cachedPolicy) {
      void refresh();
    } else {
      void getAdminOverview()
        .then((response) => {
          if (mountedRef.current) {
            setAdminOverview(unwrapItem<CommunicationAdminOverview>(response));
          }
        })
        .catch(() => undefined);
    }

    return () => {
      mountedRef.current = false;
      policyListeners.delete(listener);
    };
  }, [refresh]);

  const save = useCallback(
    async (values: CommunicationPolicyFormValues) => {
      setIsSaving(true);
      setError(null);
      try {
        const response = await updatePolicy(payloadFromValues(values));
        const nextPolicy = unwrapItem<CommunicationPolicy>(response);
        if (mountedRef.current) notifyPolicyListeners(nextPolicy);
        return nextPolicy;
      } catch (nextError) {
        const message = errorMessageFromUnknown(nextError);
        if (mountedRef.current) setError(message);
        throw nextError;
      } finally {
        if (mountedRef.current) setIsSaving(false);
      }
    },
    [],
  );

  return {
    policy,
    adminOverview,
    isLoading,
    isRefreshing,
    isSaving,
    error,
    refresh,
    save,
  };
}
