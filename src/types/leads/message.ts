// FILE: src/types/leads/message.ts
// Lead messaging types

export interface LeadMessage {
  id: string;
  leadId: string;
  senderId: string; // User ID or "parent"
  senderName: string;
  senderType: "staff" | "parent";
  message: string;
  timestamp: string; // ISO date string
  read: boolean;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string; // "image", "document", "pdf"
  url: string;
  size: number; // in bytes
}

export interface LeadConversation {
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadEmail: string;
  lastMessage?: LeadMessage;
  unreadCount: number;
  messages: LeadMessage[];
}
