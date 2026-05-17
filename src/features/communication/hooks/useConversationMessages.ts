"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteMessage,
  getConversationReadSummary,
  getMessages,
  markConversationRead,
  markMessageRead,
  sendMessage,
  updateMessage,
} from "@/features/communication/api/communication.service";
import { createCommunicationMetadata } from "@/features/communication/utils/communication-metadata";
import type { CommunicationRecord } from "@/features/communication/types/communication.types";
import type {
  Message,
  MessageStatus,
  SendMessagePayload,
} from "@/features/communication/types/message.types";
import { useAuth } from "@/hooks/use-auth";

export type LocalMessageDeliveryStatus = "pending" | "sent" | "failed";

export interface ConversationMessage extends Message {
  clientMessageId?: string;
  deliveryStatus?: LocalMessageDeliveryStatus;
  readByUserIds?: string[];
}

export interface ReadSummaryState {
  readCount?: number;
  unreadCount?: number;
}

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const stringValue = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

function messageStatus(value: unknown): MessageStatus {
  if (value === "hidden" || value === "deleted") return value;
  return "sent";
}

function unwrapItem<T>(response: unknown): T | null {
  if (!isRecord(response)) return (response ?? null) as T | null;
  const item = [response.data, response.item, response.result, response.payload].find(
    (candidate) => isRecord(candidate) && !Array.isArray(candidate),
  );
  return (item ?? response) as T;
}

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

function messageFromPayload(payload: unknown): ConversationMessage | null {
  if (!isRecord(payload)) return null;
  const source = [payload.message, payload.data, payload.payload].find(isRecord) ??
    payload;
  if (!isRecord(source)) return null;

  const id =
    stringValue(source.id) ??
    stringValue(source.messageId) ??
    stringValue(payload.messageId);
  const clientMessageId = stringValue(source.clientMessageId);
  if (!id && !clientMessageId) return null;

  return {
    ...(source as Message),
    id: id ?? clientMessageId ?? `local-${Date.now()}`,
    conversationId:
      stringValue(source.conversationId) ??
      stringValue(source.conversation_id) ??
      stringValue(payload.conversationId) ??
      stringValue(payload.conversation_id),
    clientMessageId,
    body:
      stringValue(source.body) ??
      stringValue(source.content) ??
      stringValue(source.text) ??
      "",
    status: messageStatus(source.status),
    createdAt: stringValue(source.createdAt) ?? new Date().toISOString(),
    updatedAt: stringValue(source.updatedAt),
    senderId: stringValue(source.senderId) ?? stringValue(source.userId),
    sender: isRecord(source.sender) ? (source.sender as Message["sender"]) : undefined,
    deliveryStatus: "sent",
  };
}

function sortMessages(messages: ConversationMessage[]): ConversationMessage[] {
  return [...messages].sort((left, right) => {
    const leftTime = new Date(left.createdAt ?? "").getTime();
    const rightTime = new Date(right.createdAt ?? "").getTime();
    return leftTime - rightTime;
  });
}

function dedupeMessages(
  messages: ConversationMessage[],
): ConversationMessage[] {
  const seenIds = new Set<string>();
  const seenClientIds = new Set<string>();
  const output: ConversationMessage[] = [];

  for (const message of messages) {
    const id = stringValue(message.id);
    const clientMessageId = stringValue(message.clientMessageId);
    const duplicate =
      Boolean(id && seenIds.has(id)) ||
      Boolean(clientMessageId && seenClientIds.has(clientMessageId)) ||
      Boolean(clientMessageId && seenIds.has(clientMessageId)) ||
      Boolean(id && seenClientIds.has(id));

    if (duplicate) {
      const existingIndex = output.findIndex(
        (item) =>
          (id && item.id === id) ||
          (clientMessageId && item.clientMessageId === clientMessageId) ||
          (clientMessageId && item.id === clientMessageId) ||
          (id && item.clientMessageId === id),
      );

      if (existingIndex >= 0) {
        output[existingIndex] = {
          ...output[existingIndex],
          ...message,
          id:
            message.id && !message.id.startsWith("client-")
              ? message.id
              : output[existingIndex].id,
          clientMessageId:
            message.clientMessageId ?? output[existingIndex].clientMessageId,
        };
      }
      continue;
    }

    if (id) seenIds.add(id);
    if (clientMessageId) seenClientIds.add(clientMessageId);
    output.push(message);
  }

  return output;
}

function upsertMessage(
  messages: ConversationMessage[],
  incoming: ConversationMessage,
): ConversationMessage[] {
  const next = [...messages];
  const index = next.findIndex(
    (message) =>
      message.id === incoming.id ||
      (incoming.id && message.clientMessageId === incoming.id) ||
      (incoming.clientMessageId &&
        (message.clientMessageId === incoming.clientMessageId ||
          message.id === incoming.clientMessageId)),
  );

  if (index >= 0) {
    next[index] = {
      ...next[index],
      ...incoming,
      deliveryStatus: incoming.deliveryStatus ?? next[index].deliveryStatus,
    };
  } else {
    next.push(incoming);
  }

  return sortMessages(dedupeMessages(next));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load messages.";
}

function createClientMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useConversationMessages(conversationId: string) {
  const { user } = useAuth();
  const mountedRef = useRef(false);
  const activeConversationIdRef = useRef(conversationId);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [readSummary, setReadSummary] = useState<ReadSummaryState>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMessages = useCallback(async () => {
    const requestConversationId = conversationId;
    setError(null);
    try {
      const response = await getMessages(requestConversationId, { limit: 100 });
      const nextMessages = unwrapList<Message>(response).map((message) => ({
        ...message,
        deliveryStatus: "sent" as const,
      }));
      if (
        !mountedRef.current ||
        activeConversationIdRef.current !== requestConversationId
      ) {
        return;
      }
      setMessages(sortMessages(dedupeMessages(nextMessages)));
    } catch (nextError) {
      if (
        !mountedRef.current ||
        activeConversationIdRef.current !== requestConversationId
      ) {
        return;
      }
      setError(errorMessage(nextError));
      setMessages([]);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [conversationId]);

  const refreshReadSummary = useCallback(async () => {
    const requestConversationId = conversationId;
    try {
      const response = await getConversationReadSummary(requestConversationId, {
        limit: 100,
      });
      const summary = unwrapItem<ReadSummaryState>(response);
      if (
        mountedRef.current &&
        activeConversationIdRef.current === requestConversationId &&
        summary
      ) {
        setReadSummary(summary);
      }
    } catch {
      if (
        mountedRef.current &&
        activeConversationIdRef.current === requestConversationId
      ) {
        setReadSummary({});
      }
    }
  }, [conversationId]);

  const refresh = useCallback(async () => {
    await Promise.all([refreshMessages(), refreshReadSummary()]);
  }, [refreshMessages, refreshReadSummary]);

  useEffect(() => {
    mountedRef.current = true;
    activeConversationIdRef.current = conversationId;
    setIsLoading(true);
    setMessages([]);
    setReadSummary({});
    void refresh();
    void markConversationRead(conversationId).catch(() => undefined);

    return () => {
      mountedRef.current = false;
    };
  }, [conversationId, refresh]);

  const send = useCallback(
    async (body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return;

      const clientMessageId = createClientMessageId();
      const pendingMessage: ConversationMessage = {
        id: clientMessageId,
        clientMessageId,
        conversationId,
        senderId: user?.id,
        sender: user
          ? {
              id: user.id,
              userId: user.id,
              name: `${user.firstName} ${user.lastName}`.trim(),
            }
          : undefined,
        body: trimmed,
        type: "text",
        status: "sent",
        deliveryStatus: "pending",
        createdAt: new Date().toISOString(),
      };

      setMessages((current) => upsertMessage(current, pendingMessage));

      try {
        const payload: SendMessagePayload = {
          type: "text",
          body: trimmed,
          clientMessageId,
          metadata: createCommunicationMetadata("message_send", {
            composer: "conversation_thread",
          }),
        };
        const response = await sendMessage(conversationId, payload);
        const serverMessage = messageFromPayload(response);
        if (!serverMessage) return;
        setMessages((current) =>
          upsertMessage(current, {
            ...serverMessage,
            clientMessageId:
              serverMessage.clientMessageId ?? pendingMessage.clientMessageId,
            deliveryStatus: "sent",
          }),
        );
      } catch (nextError) {
        setError(errorMessage(nextError));
        setMessages((current) =>
          current.map((message) =>
            message.clientMessageId === clientMessageId
              ? { ...message, deliveryStatus: "failed" }
              : message,
          ),
        );
      }
    },
    [conversationId, user],
  );

  const edit = useCallback(async (messageId: string, body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setIsMutating(true);
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? { ...message, body: trimmed, updatedAt: new Date().toISOString() }
          : message,
      ),
    );

    try {
      const response = await updateMessage(messageId, { body: trimmed });
      const serverMessage = messageFromPayload(response);
      if (serverMessage) {
        setMessages((current) => upsertMessage(current, serverMessage));
      }
    } catch (nextError) {
      setError(errorMessage(nextError));
      await refreshMessages();
    } finally {
      setIsMutating(false);
    }
  }, [refreshMessages]);

  const remove = useCallback(async (messageId: string) => {
    setIsMutating(true);
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? {
              ...message,
              body: "",
              status: "deleted",
              deletedAt: new Date().toISOString(),
            }
          : message,
      ),
    );

    try {
      await deleteMessage(messageId);
    } catch (nextError) {
      setError(errorMessage(nextError));
      await refreshMessages();
    } finally {
      setIsMutating(false);
    }
  }, [refreshMessages]);

  const markRead = useCallback(async (messageId: string) => {
    await markMessageRead(messageId).catch(() => undefined);
  }, []);

  const upsertFromRealtime = useCallback((payload: unknown) => {
    const message = messageFromPayload(payload);
    if (!message || message.conversationId !== conversationId) return;
    setMessages((current) => upsertMessage(current, message));
  }, [conversationId]);

  const patchFromRealtime = useCallback((payload: unknown) => {
    const message = messageFromPayload(payload);
    if (!message || message.conversationId !== conversationId) return;
    setMessages((current) => upsertMessage(current, message));
  }, [conversationId]);

  const deleteFromRealtime = useCallback((payload: unknown) => {
    const message = messageFromPayload(payload);
    if (!message || message.conversationId !== conversationId) return;
    setMessages((current) =>
      current.map((item) =>
        item.id === message.id || item.clientMessageId === message.clientMessageId
          ? {
              ...item,
              body: "",
              status: "deleted",
              deletedAt: message.deletedAt ?? new Date().toISOString(),
            }
          : item,
      ),
    );
  }, [conversationId]);

  const patchReadFromRealtime = useCallback((payload: unknown) => {
    if (!isRecord(payload)) return;
    const payloadConversationId = stringValue(payload.conversationId);
    if (payloadConversationId && payloadConversationId !== conversationId) return;

    const messageId = stringValue(payload.messageId);
    const userId = stringValue(payload.userId);
    if (messageId && userId) {
      setMessages((current) =>
        current.map((message) => {
          if (message.id !== messageId) return message;
          const readByUserIds = new Set(message.readByUserIds ?? []);
          readByUserIds.add(userId);
          return { ...message, readByUserIds: Array.from(readByUserIds) };
        }),
      );
    }
    void refreshReadSummary();
  }, [conversationId, refreshReadSummary]);

  return {
    messages,
    readSummary,
    isLoading,
    isMutating,
    error,
    refresh,
    send,
    edit,
    remove,
    markRead,
    upsertFromRealtime,
    patchFromRealtime,
    deleteFromRealtime,
    patchReadFromRealtime,
  };
}
