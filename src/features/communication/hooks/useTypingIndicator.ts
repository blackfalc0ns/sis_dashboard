"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCommunicationSocket } from "./useCommunicationSocket";
import type { CommunicationRecord } from "@/features/communication/types/communication.types";

export interface TypingUser {
  userId: string;
  name?: string;
}

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const stringValue = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

export function useTypingIndicator(conversationId: string) {
  const { user } = useAuth();
  const { startTyping, stopTyping } = useCommunicationSocket();
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingUser>>({});

  const emitTyping = useCallback(() => {
    if (!conversationId) return;
    if (!isTypingRef.current) {
      startTyping(conversationId);
      isTypingRef.current = true;
    }

    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(() => {
      stopTyping(conversationId);
      isTypingRef.current = false;
      stopTimerRef.current = null;
    }, 1500);
  }, [conversationId, startTyping, stopTyping]);

  const stopOwnTyping = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (isTypingRef.current) {
      stopTyping(conversationId);
      isTypingRef.current = false;
    }
  }, [conversationId, stopTyping]);

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }

      if (isTypingRef.current) {
        stopTyping(conversationId);
        isTypingRef.current = false;
      }
    };
  }, [conversationId, stopTyping]);

  const handleTypingStarted = useCallback(
    (payload: unknown) => {
      if (!isRecord(payload)) return;
      const payloadConversationId = stringValue(payload.conversationId);
      if (payloadConversationId && payloadConversationId !== conversationId) return;

      const actor = isRecord(payload.actor) ? payload.actor : payload;
      const userId =
        stringValue(actor.userId) ??
        stringValue(actor.id) ??
        stringValue(payload.userId);
      if (!userId || userId === user?.id) return;

      const name =
        stringValue(actor.name) ??
        stringValue(actor.nameEn) ??
        stringValue(actor.nameAr);

      setTypingUsers((current) => ({
        ...current,
        [userId]: { userId, name },
      }));
    },
    [conversationId, user?.id],
  );

  const handleTypingStopped = useCallback(
    (payload: unknown) => {
      if (!isRecord(payload)) return;
      const payloadConversationId = stringValue(payload.conversationId);
      if (payloadConversationId && payloadConversationId !== conversationId) return;

      const userId =
        stringValue(payload.userId) ??
        (isRecord(payload.actor) ? stringValue(payload.actor.id) : undefined);
      if (!userId) return;

      setTypingUsers((current) => {
        const next = { ...current };
        delete next[userId];
        return next;
      });
    },
    [conversationId],
  );

  return useMemo(
    () => ({
      typingUsers: Object.values(typingUsers),
      emitTyping,
      stopOwnTyping,
      handleTypingStarted,
      handleTypingStopped,
    }),
    [
      emitTyping,
      handleTypingStarted,
      handleTypingStopped,
      stopOwnTyping,
      typingUsers,
    ],
  );
}
