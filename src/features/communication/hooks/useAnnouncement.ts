"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  archiveAnnouncement,
  getAnnouncement,
  getAnnouncementReadSummary,
  markAnnouncementRead,
  publishAnnouncement,
  updateAnnouncement,
} from "@/features/communication/api/communication.service";
import type { CommunicationRecord } from "@/features/communication/types/communication.types";
import type {
  Announcement,
  AnnouncementReadSummary,
  UpdateAnnouncementPayload,
} from "@/features/communication/types/announcement.types";
import type { AnnouncementFormValues } from "./useAnnouncements";

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function unwrapItem<T>(response: unknown): T | null {
  if (!isRecord(response)) return (response ?? null) as T | null;

  const item = [response.data, response.item, response.result, response.payload].find(
    (candidate) => isRecord(candidate) && !Array.isArray(candidate),
  );

  return (item ?? response) as T;
}

function errorMessageFromUnknown(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load announcement.";
}

function payloadFromValues(
  values: AnnouncementFormValues,
): UpdateAnnouncementPayload {
  const targets =
    values.targetScopeType?.trim() || values.targetScopeId?.trim()
      ? [
          {
            ...(values.targetScopeType?.trim()
              ? { scopeType: values.targetScopeType.trim() }
              : {}),
            ...(values.targetScopeId?.trim()
              ? { scopeId: values.targetScopeId.trim() }
              : {}),
          },
        ]
      : undefined;

  return {
    ...(values.title?.trim() ? { title: values.title.trim() } : {}),
    ...(values.titleAr?.trim() ? { titleAr: values.titleAr.trim() } : {}),
    ...(values.titleEn?.trim() ? { titleEn: values.titleEn.trim() } : {}),
    ...(values.body?.trim() ? { body: values.body.trim() } : {}),
    ...(values.bodyAr?.trim() ? { bodyAr: values.bodyAr.trim() } : {}),
    ...(values.bodyEn?.trim() ? { bodyEn: values.bodyEn.trim() } : {}),
    ...(values.priority ? { priority: values.priority } : {}),
    ...(targets ? { targets } : {}),
  };
}

export function useAnnouncement(announcementId: string) {
  const mountedRef = useRef(false);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [readSummary, setReadSummary] =
    useState<AnnouncementReadSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAnnouncement = useCallback(async () => {
    const response = await getAnnouncement(announcementId);
    const item = unwrapItem<Announcement>(response);
    if (mountedRef.current) setAnnouncement(item);
  }, [announcementId]);

  const refreshReadSummary = useCallback(async () => {
    try {
      const response = await getAnnouncementReadSummary(announcementId);
      const item = unwrapItem<AnnouncementReadSummary>(response);
      if (mountedRef.current) setReadSummary(item);
    } catch {
      if (mountedRef.current) setReadSummary(null);
    }
  }, [announcementId]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      await Promise.all([refreshAnnouncement(), refreshReadSummary()]);
    } catch (nextError) {
      if (mountedRef.current) setError(errorMessageFromUnknown(nextError));
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [refreshAnnouncement, refreshReadSummary]);

  useEffect(() => {
    mountedRef.current = true;
    setIsLoading(true);
    void refresh();

    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  useEffect(() => {
    void markAnnouncementRead(announcementId).catch(() => undefined);
  }, [announcementId]);

  const mutate = useCallback(
    async (operation: () => Promise<unknown>) => {
      setIsMutating(true);
      setError(null);

      try {
        const response = await operation();
        await refresh();
        return response;
      } catch (nextError) {
        setError(errorMessageFromUnknown(nextError));
        throw nextError;
      } finally {
        if (mountedRef.current) setIsMutating(false);
      }
    },
    [refresh],
  );

  const update = useCallback(
    async (values: AnnouncementFormValues) => {
      const response = await mutate(() =>
        updateAnnouncement(announcementId, payloadFromValues(values)),
      );
      return unwrapItem<Announcement>(response);
    },
    [announcementId, mutate],
  );

  const publish = useCallback(
    () => mutate(() => publishAnnouncement(announcementId)),
    [announcementId, mutate],
  );

  const archive = useCallback(
    () => mutate(() => archiveAnnouncement(announcementId)),
    [announcementId, mutate],
  );

  return {
    announcement,
    readSummary,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    refresh,
    update,
    publish,
    archive,
  };
}
