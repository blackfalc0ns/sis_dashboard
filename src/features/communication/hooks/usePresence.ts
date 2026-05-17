"use client";

import { useCallback, useMemo, useState } from "react";
import type { CommunicationRecord } from "@/features/communication/types/communication.types";

export interface CommunicationPresence {
  userId: string;
  status?: string;
  isOnline?: boolean;
  lastSeenAt?: string;
}

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const stringValue = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

export function usePresence() {
  const [presenceByUserId, setPresenceByUserId] = useState<
    Record<string, CommunicationPresence>
  >({});

  const handlePresenceUpdated = useCallback((payload: unknown) => {
    if (!isRecord(payload)) return;
    const source = isRecord(payload.user) ? payload.user : payload;
    const userId =
      stringValue(source.userId) ??
      stringValue(source.id) ??
      stringValue(payload.userId);
    if (!userId) return;

    setPresenceByUserId((current) => ({
      ...current,
      [userId]: {
        userId,
        status: stringValue(source.status) ?? stringValue(payload.status),
        isOnline:
          typeof source.isOnline === "boolean"
            ? source.isOnline
            : typeof payload.isOnline === "boolean"
              ? payload.isOnline
              : undefined,
        lastSeenAt:
          stringValue(source.lastSeenAt) ?? stringValue(payload.lastSeenAt),
      },
    }));
  }, []);

  return useMemo(
    () => ({
      presenceByUserId,
      handlePresenceUpdated,
    }),
    [handlePresenceUpdated, presenceByUserId],
  );
}
