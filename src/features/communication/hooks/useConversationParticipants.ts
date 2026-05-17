"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  addParticipant,
  getParticipants,
} from "@/features/communication/api/communication.service";
import type { CommunicationRecord } from "@/features/communication/types/communication.types";
import type {
  AddParticipantPayload,
  ConversationParticipant,
} from "@/features/communication/types/conversation.types";

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function unwrapList<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response as T[];
  if (!isRecord(response)) return [];

  const sources = [
    response,
    response.data,
    response.result,
    response.payload,
  ].filter(isRecord);
  const itemSource = sources.find((source) => Array.isArray(source.items));
  if (itemSource) return itemSource.items as T[];

  const arraySource = [
    response.data,
    response.result,
    response.payload,
  ].find(Array.isArray);
  return arraySource ? (arraySource as T[]) : [];
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load participants.";
}

export function useConversationParticipants(conversationId: string) {
  const mountedRef = useRef(false);
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const response = await getParticipants(conversationId);
      if (!mountedRef.current) return;
      setParticipants(unwrapList<ConversationParticipant>(response));
    } catch (nextError) {
      if (!mountedRef.current) return;
      setError(errorMessage(nextError));
      setParticipants([]);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [conversationId]);

  const add = useCallback(
    async (payload: AddParticipantPayload) => {
      setIsMutating(true);
      try {
        await addParticipant(conversationId, payload);
        await refresh();
      } finally {
        if (mountedRef.current) setIsMutating(false);
      }
    },
    [conversationId, refresh],
  );

  useEffect(() => {
    mountedRef.current = true;
    setIsLoading(true);
    void refresh();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  return {
    participants,
    isLoading,
    isMutating,
    error,
    refresh,
    add,
  };
}
