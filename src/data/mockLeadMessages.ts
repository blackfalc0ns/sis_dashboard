// FILE: src/data/mockLeadMessages.ts
// Mock data for lead messaging/chat system

import type { LeadMessage, LeadConversation } from "@/types/leads/message";
import { mockLeads } from "./mockDataLinked";

// Mock messages for each lead
export const mockLeadMessages: LeadMessage[] = [
  // L001 - Hassan Ahmed
  {
    id: "MSG-L001-001",
    leadId: "L001",
    senderId: "parent",
    senderName: "Hassan Ahmed",
    senderType: "parent",
    message:
      "Hello, I'm interested in enrolling my son Ahmed in Grade 6. Can you provide more information about the STEM program?",
    timestamp: "2026-01-05T09:15:00Z",
    read: true,
  },
  {
    id: "MSG-L001-002",
    leadId: "L001",
    senderId: "U001",
    senderName: "Sarah Johnson",
    senderType: "staff",
    message:
      "Hello Mr. Hassan! Thank you for your interest. Our STEM program offers hands-on learning in science, technology, engineering, and mathematics. Would you like to schedule a campus tour?",
    timestamp: "2026-01-05T10:30:00Z",
    read: true,
  },
  {
    id: "MSG-L001-003",
    leadId: "L001",
    senderId: "parent",
    senderName: "Hassan Ahmed",
    senderType: "parent",
    message: "Yes, that would be great! What times are available this week?",
    timestamp: "2026-01-05T11:00:00Z",
    read: true,
  },
  {
    id: "MSG-L001-004",
    leadId: "L001",
    senderId: "U001",
    senderName: "Sarah Johnson",
    senderType: "staff",
    message:
      "We have availability on Wednesday at 2 PM or Thursday at 10 AM. Which works better for you?",
    timestamp: "2026-01-05T14:20:00Z",
    read: true,
  },
  {
    id: "MSG-L001-005",
    leadId: "L001",
    senderId: "parent",
    senderName: "Hassan Ahmed",
    senderType: "parent",
    message: "Thursday at 10 AM works perfectly. See you then!",
    timestamp: "2026-01-05T15:45:00Z",
    read: true,
  },

  // L002 - Mohammed Ali
  {
    id: "MSG-L002-001",
    leadId: "L002",
    senderId: "parent",
    senderName: "Mohammed Ali",
    senderType: "parent",
    message:
      "Hi, I was referred by a current parent. I'd like to know about Grade 7 enrollment for my daughter Sara.",
    timestamp: "2026-01-08T08:30:00Z",
    read: true,
  },
  {
    id: "MSG-L002-002",
    leadId: "L002",
    senderId: "U002",
    senderName: "Ahmed Al-Mansoori",
    senderType: "staff",
    message:
      "Welcome! We're glad you were referred to us. Grade 7 has excellent programs. I can send you our enrollment package. What's the best email to send it to?",
    timestamp: "2026-01-08T09:15:00Z",
    read: true,
  },
  {
    id: "MSG-L002-003",
    leadId: "L002",
    senderId: "parent",
    senderName: "Mohammed Ali",
    senderType: "parent",
    message:
      "Please send it to mohammed.ali@email.com. Also, what are the tuition fees?",
    timestamp: "2026-01-08T10:00:00Z",
    read: true,
  },
  {
    id: "MSG-L002-004",
    leadId: "L002",
    senderId: "U002",
    senderName: "Ahmed Al-Mansoori",
    senderType: "staff",
    message:
      "Package sent! Tuition details are included. For Grade 7, the annual fee is AED 45,000. We also offer payment plans. Would you like to discuss this further?",
    timestamp: "2026-01-08T11:30:00Z",
    read: true,
  },

  // L003 - Abdullah Omar
  {
    id: "MSG-L003-001",
    leadId: "L003",
    senderId: "parent",
    senderName: "Abdullah Omar",
    senderType: "parent",
    message:
      "Good morning, I submitted an inquiry through your website about Grade 8. Looking for a school with strong Arabic program.",
    timestamp: "2026-01-10T07:45:00Z",
    read: true,
  },
  {
    id: "MSG-L003-002",
    leadId: "L003",
    senderId: "U003",
    senderName: "Fatima Al-Zaabi",
    senderType: "staff",
    message:
      "Good morning Mr. Abdullah! Our Arabic program is one of our strongest offerings. We have native Arabic teachers and comprehensive curriculum. When would you like to visit?",
    timestamp: "2026-01-10T09:00:00Z",
    read: true,
  },
  {
    id: "MSG-L003-003",
    leadId: "L003",
    senderId: "parent",
    senderName: "Abdullah Omar",
    senderType: "parent",
    message:
      "That sounds excellent. Can I visit next week? Also, do you have any entrance requirements?",
    timestamp: "2026-01-10T10:30:00Z",
    read: true,
  },
  {
    id: "MSG-L003-004",
    leadId: "L003",
    senderId: "U003",
    senderName: "Fatima Al-Zaabi",
    senderType: "staff",
    message:
      "Yes, next week works! For Grade 8, we require a placement test and interview. I'll schedule both for you. What day works best?",
    timestamp: "2026-01-10T12:00:00Z",
    read: true,
  },

  // L004 - Khalid Ibrahim (New lead with unread messages)
  {
    id: "MSG-L004-001",
    leadId: "L004",
    senderId: "parent",
    senderName: "Khalid Ibrahim",
    senderType: "parent",
    message:
      "Hello, I visited your school yesterday and I'm interested in Grade 9 for my daughter Fatima. She's very active in sports.",
    timestamp: "2026-02-01T14:20:00Z",
    read: false,
  },
  {
    id: "MSG-L004-002",
    leadId: "L004",
    senderId: "parent",
    senderName: "Khalid Ibrahim",
    senderType: "parent",
    message: "Do you have any sports programs or teams she could join?",
    timestamp: "2026-02-01T14:22:00Z",
    read: false,
  },
];

// Generate conversations from messages
export const mockLeadConversations: LeadConversation[] = mockLeads.map(
  (lead) => {
    const messages = mockLeadMessages.filter((msg) => msg.leadId === lead.id);
    const unreadCount = messages.filter(
      (msg) => !msg.read && msg.senderType === "parent",
    ).length;
    const lastMessage =
      messages.length > 0 ? messages[messages.length - 1] : undefined;

    return {
      leadId: lead.id,
      leadName: lead.name,
      leadPhone: lead.phone,
      leadEmail: lead.email || "",
      lastMessage,
      unreadCount,
      messages,
    };
  },
);

// Helper functions for API simulation
export function getMessagesByLeadId(leadId: string): LeadMessage[] {
  return mockLeadMessages.filter((msg) => msg.leadId === leadId);
}

export function getConversationByLeadId(
  leadId: string,
): LeadConversation | undefined {
  return mockLeadConversations.find((conv) => conv.leadId === leadId);
}

export function sendMessage(
  leadId: string,
  message: string,
  senderId: string,
  senderName: string,
  senderType: "staff" | "parent",
): LeadMessage {
  const newMessage: LeadMessage = {
    id: `MSG-${leadId}-${Date.now()}`,
    leadId,
    senderId,
    senderName,
    senderType,
    message,
    timestamp: new Date().toISOString(),
    read: senderType === "staff", // Staff messages are automatically marked as read
  };

  mockLeadMessages.push(newMessage);
  return newMessage;
}

export function markMessagesAsRead(leadId: string): void {
  mockLeadMessages.forEach((msg) => {
    if (msg.leadId === leadId && msg.senderType === "parent") {
      msg.read = true;
    }
  });
}

// Additional messages for new leads (L005-L008)
mockLeadMessages.push(
  // L005 - Fatima Al-Zaabi (Closed - decided on another school)
  {
    id: "MSG-L005-001",
    leadId: "L005",
    senderId: "parent",
    senderName: "Fatima Al-Zaabi",
    senderType: "parent",
    message:
      "Hi, I'm interested in Grade 10 enrollment for my son. Can you send me information?",
    timestamp: "2025-12-15T10:00:00Z",
    read: true,
  },
  {
    id: "MSG-L005-002",
    leadId: "L005",
    senderId: "U002",
    senderName: "Ahmed Al-Mansoori",
    senderType: "staff",
    message:
      "Hello! I'd be happy to help. I'll send you our Grade 10 program details and tuition information.",
    timestamp: "2025-12-15T11:30:00Z",
    read: true,
  },
  {
    id: "MSG-L005-003",
    leadId: "L005",
    senderId: "parent",
    senderName: "Fatima Al-Zaabi",
    senderType: "parent",
    message:
      "Thank you for the information. After careful consideration, we've decided to enroll at another school closer to our home.",
    timestamp: "2025-12-20T09:00:00Z",
    read: true,
  },

  // L006 - Salem Hassan (Contacted - follow-up scheduled)
  {
    id: "MSG-L006-001",
    leadId: "L006",
    senderId: "parent",
    senderName: "Salem Hassan",
    senderType: "parent",
    message:
      "Good morning, I submitted an inquiry about your bilingual program for Grade 6.",
    timestamp: "2026-01-28T08:00:00Z",
    read: true,
  },
  {
    id: "MSG-L006-002",
    leadId: "L006",
    senderId: "U001",
    senderName: "Sarah Johnson",
    senderType: "staff",
    message:
      "Good morning! Our bilingual program is excellent. Would you like to schedule a call to discuss it in detail?",
    timestamp: "2026-01-28T09:30:00Z",
    read: true,
  },
  {
    id: "MSG-L006-003",
    leadId: "L006",
    senderId: "parent",
    senderName: "Salem Hassan",
    senderType: "parent",
    message: "Yes, that would be great. I'm available this week.",
    timestamp: "2026-01-28T10:15:00Z",
    read: true,
  },

  // L007 - Mariam Khalid (Qualified - discussing tuition)
  {
    id: "MSG-L007-001",
    leadId: "L007",
    senderId: "parent",
    senderName: "Mariam Khalid",
    senderType: "parent",
    message:
      "Hello, I visited the school last week and was very impressed. I'd like to discuss enrollment for Grade 7.",
    timestamp: "2026-01-20T13:00:00Z",
    read: true,
  },
  {
    id: "MSG-L007-002",
    leadId: "L007",
    senderId: "U003",
    senderName: "Fatima Al-Zaabi",
    senderType: "staff",
    message:
      "Thank you for visiting! I'm glad you liked what you saw. Let me send you the enrollment package and tuition details.",
    timestamp: "2026-01-20T14:30:00Z",
    read: true,
  },
  {
    id: "MSG-L007-003",
    leadId: "L007",
    senderId: "parent",
    senderName: "Mariam Khalid",
    senderType: "parent",
    message:
      "Received, thank you! Do you offer payment plans? I'd like to discuss the options.",
    timestamp: "2026-01-21T09:00:00Z",
    read: true,
  },
  {
    id: "MSG-L007-004",
    leadId: "L007",
    senderId: "U003",
    senderName: "Fatima Al-Zaabi",
    senderType: "staff",
    message:
      "Yes, we offer flexible payment plans. Let me schedule a meeting with our finance team to discuss the best option for you.",
    timestamp: "2026-01-21T10:30:00Z",
    read: true,
  },

  // L008 - Ahmed Rashid (New - from school fair)
  {
    id: "MSG-L008-001",
    leadId: "L008",
    senderId: "parent",
    senderName: "Ahmed Rashid",
    senderType: "parent",
    message:
      "Hi, I met your team at the school fair yesterday. I'm interested in Grade 8 for my son Hamza.",
    timestamp: "2026-02-10T16:00:00Z",
    read: false,
  },
);
