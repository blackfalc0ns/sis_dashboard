// FILE: src/types/notifications.ts

export type NotificationChannel = "in_app" | "email" | "sms";
export type NotificationStatus = "pending" | "sent" | "failed" | "read";

export type NotificationStage =
  | "lead_created"
  | "lead_contacted"
  | "application_submitted"
  | "documents_pending"
  | "documents_complete"
  | "test_scheduled"
  | "test_completed"
  | "interview_scheduled"
  | "interview_completed"
  | "under_review"
  | "decision_accepted"
  | "decision_waitlisted"
  | "decision_rejected"
  | "enrollment_complete";

export interface NotificationTemplate {
  stage: NotificationStage;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  emailSubject: string;
  emailSubjectAr: string;
  smsMessage: string;
  smsMessageAr: string;
  channels: NotificationChannel[];
  priority: "low" | "medium" | "high";
}

export interface Notification {
  id: string;
  recipientId: string; // Guardian ID
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  studentName: string;
  applicationId?: string;
  leadId?: string;
  stage: NotificationStage;
  channels: NotificationChannel[];
  status: Record<NotificationChannel, NotificationStatus>;
  title: string;
  message: string;
  data?: Record<string, unknown>; // Additional data (test scores, interview dates, etc.)
  createdAt: string;
  sentAt?: Record<NotificationChannel, string>;
  readAt?: string;
  language: "en" | "ar";
}

export interface NotificationPreferences {
  guardianId: string;
  enableInApp: boolean;
  enableEmail: boolean;
  enableSMS: boolean;
  language: "en" | "ar";
  emailAddress?: string;
  phoneNumber?: string;
}
