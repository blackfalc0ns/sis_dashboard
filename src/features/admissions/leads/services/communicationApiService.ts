// Communication API Service
// Minimal wrapper for lead chat via /communication/conversations

import { apiGet, apiPost } from "@/lib/api";
import type { LeadMessage } from "@/features/admissions/leads/types/message";

// ---- API response types ----

interface ApiConversation {
  id: string;
  [key: string]: unknown;
}

interface ApiMessage {
  id: string;
  content?: string;
  body?: string;
  message?: string;
  createdAt?: string;
  timestamp?: string;
  sender?: {
    id: string;
    name?: string;
    fullName?: string;
    role?: string;
  };
  senderId?: string;
  senderName?: string;
  senderType?: string;
  [key: string]: unknown;
}

// ---- Unwrapping helpers ----

function unwrapConversation(response: unknown): ApiConversation {
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (obj.data && typeof obj.data === "object") return obj.data as ApiConversation;
  }
  return response as ApiConversation;
}

function unwrapMessages(response: unknown): ApiMessage[] {
  if (Array.isArray(response)) return response;
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.items)) return obj.items;
    if (Array.isArray(obj.messages)) return obj.messages;
  }
  return [];
}

// ---- Map API message to LeadMessage ----

function mapApiMessageToLeadMessage(msg: ApiMessage, leadId: string): LeadMessage {
  const senderId = msg.sender?.id || msg.senderId || "";
  const senderName = msg.sender?.name || msg.sender?.fullName || msg.senderName || "Unknown";
  const senderRole = msg.sender?.role || msg.senderType || "";
  const isStaff = senderRole !== "parent" && senderRole !== "guardian";

  return {
    id: msg.id,
    leadId,
    senderId,
    senderName,
    senderType: isStaff ? "staff" : "parent",
    message: msg.content || msg.body || msg.message || "",
    timestamp: msg.createdAt || msg.timestamp || new Date().toISOString(),
    read: true,
  };
}

// ---- Public API ----

/**
 * Get or create a direct conversation with a participant (lead contact).
 * Returns the conversation ID.
 */
export async function getOrCreateDirectConversation(participantId: string): Promise<string> {
  const response = await apiGet<unknown>(
    `/communication/conversations/direct/${participantId}`
  );
  const conversation = unwrapConversation(response);
  return conversation.id;
}

/**
 * Fetch messages for a conversation.
 */
export async function fetchConversationMessages(
  conversationId: string,
  leadId: string
): Promise<LeadMessage[]> {
  const response = await apiGet<unknown>(
    `/communication/conversations/${conversationId}/messages`
  );
  return unwrapMessages(response).map((msg) => mapApiMessageToLeadMessage(msg, leadId));
}

/**
 * Send a message to a conversation.
 */
export async function sendConversationMessage(
  conversationId: string,
  content: string,
  leadId: string
): Promise<LeadMessage> {
  const response = await apiPost<unknown>(
    `/communication/conversations/${conversationId}/messages`,
    { content }
  );
  const msg = (response && typeof response === "object" && "data" in (response as Record<string, unknown>))
    ? (response as Record<string, unknown>).data as ApiMessage
    : response as ApiMessage;
  return mapApiMessageToLeadMessage(msg, leadId);
}

/**
 * Mark all messages in a conversation as read.
 */
export async function markConversationAsRead(conversationId: string): Promise<void> {
  await apiPost<unknown>(
    `/communication/conversations/${conversationId}/read`,
    {}
  );
}
