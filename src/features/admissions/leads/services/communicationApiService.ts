// Communication API Service
// Lead chat adapter over the Swagger-backed /communication/conversations API.

import { apiGet, apiPost } from "@/lib/api";
import type { LeadMessage } from "@/features/admissions/leads/types/message";

const CONVERSATIONS_ENDPOINT = "/communication/conversations";

type ApiRecord = Record<string, unknown>;

interface LeadConversationInput {
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadEmail?: string;
}

interface ApiConversation extends ApiRecord {
  id?: string;
  conversationId?: string;
}

interface ApiMessage extends ApiRecord {
  id?: string;
  messageId?: string;
  content?: string;
  body?: string;
  message?: string;
  text?: string;
  createdAt?: string;
  created_at?: string;
  timestamp?: string;
  sentAt?: string;
  sender?: {
    id?: string;
    name?: string;
    fullName?: string;
    role?: string;
    type?: string;
  };
  senderId?: string;
  sender_id?: string;
  senderName?: string;
  sender_name?: string;
  senderType?: string;
  sender_type?: string;
}

const isRecord = (value: unknown): value is ApiRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const readString = (record: ApiRecord, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
    if (typeof value === "number") {
      return String(value);
    }
  }
  return undefined;
};

const unwrapMaybeEnvelope = (response: unknown): unknown => {
  if (!isRecord(response)) {
    return response;
  }

  if (typeof response.data !== "undefined") return response.data;
  if (typeof response.result !== "undefined") return response.result;
  if (typeof response.payload !== "undefined") return response.payload;
  if (typeof response.conversation !== "undefined") return response.conversation;
  if (typeof response.message !== "undefined" && isRecord(response.message)) {
    return response.message;
  }

  return response;
};

function unwrapArray(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;

  const unwrapped = unwrapMaybeEnvelope(response);
  if (Array.isArray(unwrapped)) return unwrapped;

  if (isRecord(unwrapped)) {
    if (Array.isArray(unwrapped.items)) return unwrapped.items;
    if (Array.isArray(unwrapped.conversations)) return unwrapped.conversations;
    if (Array.isArray(unwrapped.messages)) return unwrapped.messages;
    if (isRecord(unwrapped.data) && Array.isArray(unwrapped.data.items)) {
      return unwrapped.data.items;
    }
    if (isRecord(unwrapped.result) && Array.isArray(unwrapped.result.items)) {
      return unwrapped.result.items;
    }
    if (isRecord(unwrapped.payload) && Array.isArray(unwrapped.payload.items)) {
      return unwrapped.payload.items;
    }
  }

  return [];
}

function unwrapConversation(response: unknown): ApiConversation {
  const unwrapped = unwrapMaybeEnvelope(response);
  if (!isRecord(unwrapped)) {
    throw new Error("Invalid conversation response shape from API.");
  }
  return unwrapped as ApiConversation;
}

function unwrapMessage(response: unknown): ApiMessage {
  const unwrapped = unwrapMaybeEnvelope(response);
  if (!isRecord(unwrapped)) {
    throw new Error("Invalid message response shape from API.");
  }
  return unwrapped as ApiMessage;
}

function getConversationId(conversation: ApiConversation): string | null {
  return (
    readString(conversation, ["id", "conversationId", "conversation_id"]) ?? null
  );
}

function conversationBelongsToLead(conversation: unknown, leadId: string): boolean {
  if (!isRecord(conversation)) {
    return false;
  }

  const metadata = isRecord(conversation.metadata) ? conversation.metadata : {};
  const context = isRecord(conversation.context) ? conversation.context : {};
  const title = readString(conversation, ["title", "subject", "name"]) || "";
  const candidateValues = [
    conversation.leadId,
    conversation.lead_id,
    conversation.contextId,
    conversation.context_id,
    metadata.leadId,
    metadata.lead_id,
    metadata.contextId,
    context.leadId,
    context.id,
  ];

  return (
    candidateValues.some((value) => String(value || "") === leadId) ||
    title.includes(leadId)
  );
}

function buildLeadConversationPayload(input: LeadConversationInput): ApiRecord {
  const title = input.leadName
    ? `Admissions lead: ${input.leadName} (${input.leadId})`
    : `Admissions lead ${input.leadId}`;

  return {
    title,
    type: "direct",
    description: `Admissions lead conversation for ${input.leadName || input.leadId}`,
    isReadOnly: false,
    isPinned: false,
    metadata: {
      leadId: input.leadId,
      leadName: input.leadName,
      leadPhone: input.leadPhone,
      leadEmail: input.leadEmail || null,
      source: "admissions_leads",
    },
  };
}

function buildMessagePayload(content: string, leadId: string): ApiRecord {
  return {
    type: "text",
    body: content,
    clientMessageId:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${leadId}-${Date.now()}`,
    metadata: {
      source: "admissions_leads",
      leadId,
    },
  };
}

function mapApiMessageToLeadMessage(msg: ApiMessage, leadId: string): LeadMessage {
  const id = readString(msg, ["id", "messageId", "message_id"]);
  const sender = isRecord(msg.sender) ? msg.sender : {};
  const senderId =
    readString(sender, ["id"]) ||
    readString(msg, ["senderId", "sender_id"]) ||
    "current-user";
  const senderName =
    readString(sender, ["name", "fullName"]) ||
    readString(msg, ["senderName", "sender_name"]) ||
    "Admissions";
  const senderRole =
    readString(sender, ["role", "type"]) ||
    readString(msg, ["senderType", "sender_type"]) ||
    "";
  const normalizedSenderRole = senderRole.toLowerCase();
  const isParent =
    normalizedSenderRole.includes("parent") ||
    normalizedSenderRole.includes("guardian") ||
    normalizedSenderRole.includes("lead");

  return {
    id: id || `${leadId}-${Date.now()}`,
    leadId,
    senderId,
    senderName,
    senderType: isParent ? "parent" : "staff",
    message: readString(msg, ["content", "body", "message", "text"]) || "",
    timestamp:
      readString(msg, ["createdAt", "created_at", "timestamp", "sentAt"]) ||
      new Date().toISOString(),
    read: Boolean(msg.read ?? msg.isRead ?? true),
  };
}

export async function getOrCreateLeadConversation(
  input: LeadConversationInput,
): Promise<string> {
  const conversationsResponse = await apiGet<unknown>(CONVERSATIONS_ENDPOINT);
  const existingConversation = unwrapArray(conversationsResponse)
    .filter(isRecord)
    .find((conversation) => conversationBelongsToLead(conversation, input.leadId));

  if (existingConversation) {
    const id = getConversationId(existingConversation as ApiConversation);
    if (id) {
      return id;
    }
  }

  const createdConversation = unwrapConversation(
    await apiPost<unknown>(
      CONVERSATIONS_ENDPOINT,
      buildLeadConversationPayload(input),
    ),
  );
  const createdId = getConversationId(createdConversation);
  if (!createdId) {
    throw new Error("Created conversation response is missing an id.");
  }

  return createdId;
}

/**
 * @deprecated Use getOrCreateLeadConversation so the conversation can be tagged
 * with admissions lead metadata.
 */
export async function getOrCreateDirectConversation(
  participantId: string,
): Promise<string> {
  return getOrCreateLeadConversation({
    leadId: participantId,
    leadName: "",
    leadPhone: "",
  });
}

export async function fetchConversationMessages(
  conversationId: string,
  leadId: string,
): Promise<LeadMessage[]> {
  const response = await apiGet<unknown>(
    `${CONVERSATIONS_ENDPOINT}/${conversationId}/messages`,
  );
  return unwrapArray(response)
    .filter(isRecord)
    .map((msg) => mapApiMessageToLeadMessage(msg as ApiMessage, leadId));
}

export async function sendConversationMessage(
  conversationId: string,
  content: string,
  leadId: string,
): Promise<LeadMessage> {
  const response = await apiPost<unknown>(
    `${CONVERSATIONS_ENDPOINT}/${conversationId}/messages`,
    buildMessagePayload(content, leadId),
  );
  return mapApiMessageToLeadMessage(unwrapMessage(response), leadId);
}

export async function markConversationAsRead(
  conversationId: string,
): Promise<void> {
  await apiPost<unknown>(`${CONVERSATIONS_ENDPOINT}/${conversationId}/read`, {
    readAt: new Date().toISOString(),
  });
}
