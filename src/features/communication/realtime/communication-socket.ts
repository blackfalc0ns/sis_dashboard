"use client";

import { io, type Socket } from "socket.io-client";
import { tokenStorage } from "@/lib/token-storage";
import { COMMUNICATION_SOCKET_EVENTS } from "./communication-events";

export const COMMUNICATION_REALTIME_URL =
  process.env.NEXT_PUBLIC_REALTIME_URL ||
  "https://api.moazez.sa/api/v1/realtime";

export interface CommunicationRealtimePayload {
  conversationId?: string;
  messageId?: string;
  userId?: string;
  [key: string]: unknown;
}

export interface CommunicationRoomPayload {
  conversationId: string;
}

export interface CommunicationTypingPayload extends CommunicationRoomPayload {
  messageDraftId?: string;
}

export interface CommunicationServerToClientEvents {
  connect: () => void;
  disconnect: (reason: Socket.DisconnectReason) => void;
  connect_error: (error: Error) => void;
  reconnect: (attempt: number) => void;
  [COMMUNICATION_SOCKET_EVENTS.messageCreated]: (
    payload: CommunicationRealtimePayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.messageUpdated]: (
    payload: CommunicationRealtimePayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.messageDeleted]: (
    payload: CommunicationRealtimePayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.messageRead]: (
    payload: CommunicationRealtimePayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.reactionUpserted]: (
    payload: CommunicationRealtimePayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.reactionDeleted]: (
    payload: CommunicationRealtimePayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.attachmentLinked]: (
    payload: CommunicationRealtimePayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.attachmentDeleted]: (
    payload: CommunicationRealtimePayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.typingStarted]: (
    payload: CommunicationTypingPayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.typingStopped]: (
    payload: CommunicationTypingPayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.presenceUserUpdated]: (
    payload: CommunicationRealtimePayload,
  ) => void;
}

export interface CommunicationClientToServerEvents {
  [COMMUNICATION_SOCKET_EVENTS.conversationJoin]: (
    payload: CommunicationRoomPayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.conversationLeave]: (
    payload: CommunicationRoomPayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.typingStarted]: (
    payload: CommunicationTypingPayload,
  ) => void;
  [COMMUNICATION_SOCKET_EVENTS.typingStopped]: (
    payload: CommunicationTypingPayload,
  ) => void;
}

export type CommunicationSocket = Socket<
  CommunicationServerToClientEvents,
  CommunicationClientToServerEvents
>;

export function getCommunicationAccessToken(): string | null {
  return tokenStorage.getAccessToken();
}

export function createCommunicationSocket(
  token: string,
): CommunicationSocket | null {
  if (typeof window === "undefined" || !token) {
    return null;
  }

  return io(COMMUNICATION_REALTIME_URL, {
    autoConnect: false,
    auth: {
      token,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
  });
}
