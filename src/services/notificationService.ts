// FILE: src/services/notificationService.ts

import {
  Notification,
  NotificationChannel,
  NotificationStage,
  NotificationStatus,
} from "@/types/notifications";
import { NOTIFICATION_TEMPLATES } from "@/config/notificationTemplates";
import { Application, Guardian } from "@/types/admissions";

/**
 * Replace template variables with actual data
 */
function replaceTemplateVariables(
  template: string,
  data: Record<string, string>,
): string {
  let result = template;
  Object.entries(data).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{${key}}`, "g"), value);
  });
  return result;
}

/**
 * Generate notification ID
 */
function generateNotificationId(): string {
  return `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a notification for a specific stage
 */
export function createNotification(
  stage: NotificationStage,
  guardian: Guardian,
  studentName: string,
  data: Record<string, string> = {},
  applicationId?: string,
  leadId?: string,
  language: "en" | "ar" = "en",
): Notification {
  const template = NOTIFICATION_TEMPLATES[stage];

  if (!template) {
    throw new Error(`No template found for stage: ${stage}`);
  }

  // Prepare template data
  const templateData = {
    studentName,
    applicationId: applicationId || "",
    guardianName: guardian.full_name,
    schoolName: "Moazzez School",
    schoolPhone: "+971-4-XXX-XXXX",
    ...data,
  };

  // Generate notification content based on language
  const title =
    language === "ar"
      ? replaceTemplateVariables(template.titleAr, templateData)
      : replaceTemplateVariables(template.title, templateData);

  const message =
    language === "ar"
      ? replaceTemplateVariables(template.messageAr, templateData)
      : replaceTemplateVariables(template.message, templateData);

  // Initialize status for each channel
  const status: Record<NotificationChannel, NotificationStatus> = {
    in_app: "pending",
    email: "pending",
    sms: "pending",
  };

  return {
    id: generateNotificationId(),
    recipientId: guardian.id || "",
    recipientName: guardian.full_name,
    recipientEmail: guardian.email,
    recipientPhone: guardian.phone_primary,
    studentName,
    applicationId,
    leadId,
    stage,
    channels: template.channels,
    status,
    title,
    message,
    data: templateData,
    createdAt: new Date().toISOString(),
    language,
  };
}

/**
 * Send notification through specified channels
 */
export async function sendNotification(
  notification: Notification,
): Promise<void> {
  const results: Partial<Record<NotificationChannel, boolean>> = {};

  // Send through each channel
  for (const channel of notification.channels) {
    try {
      switch (channel) {
        case "in_app":
          await sendInAppNotification(notification);
          results[channel] = true;
          break;
        case "email":
          await sendEmailNotification(notification);
          results[channel] = true;
          break;
        case "sms":
          await sendSMSNotification(notification);
          results[channel] = true;
          break;
      }
    } catch (error) {
      console.error(`Failed to send ${channel} notification:`, error);
      results[channel] = false;
    }
  }

  // Update notification status
  notification.channels.forEach((channel) => {
    notification.status[channel] = results[channel] ? "sent" : "failed";
    if (results[channel]) {
      if (!notification.sentAt) {
        notification.sentAt = {} as Record<NotificationChannel, string>;
      }
      notification.sentAt[channel] = new Date().toISOString();
    }
  });
}

/**
 * Send in-app notification
 */
async function sendInAppNotification(
  notification: Notification,
): Promise<void> {
  // In production, this would save to database and trigger real-time update
  console.log("📱 In-App Notification:", {
    to: notification.recipientName,
    title: notification.title,
    message: notification.message,
  });

  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Store in localStorage for demo (in production, use database)
  const existingNotifications = JSON.parse(
    localStorage.getItem("notifications") || "[]",
  );
  existingNotifications.push(notification);
  localStorage.setItem("notifications", JSON.stringify(existingNotifications));
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  notification: Notification,
): Promise<void> {
  const template = NOTIFICATION_TEMPLATES[notification.stage];
  const subject =
    notification.language === "ar"
      ? replaceTemplateVariables(
          template.emailSubjectAr,
          (notification.data || {}) as Record<string, string>,
        )
      : replaceTemplateVariables(
          template.emailSubject,
          (notification.data || {}) as Record<string, string>,
        );

  console.log("📧 Email Notification:", {
    to: notification.recipientEmail,
    subject,
    body: notification.message,
  });

  // In production, integrate with email service (SendGrid, AWS SES, etc.)
  // Example:
  // await emailService.send({
  //   to: notification.recipientEmail,
  //   subject,
  //   html: generateEmailHTML(notification),
  // });

  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 200));
}

/**
 * Send SMS notification
 */
async function sendSMSNotification(notification: Notification): Promise<void> {
  const template = NOTIFICATION_TEMPLATES[notification.stage];
  const smsMessage =
    notification.language === "ar"
      ? replaceTemplateVariables(
          template.smsMessageAr,
          (notification.data || {}) as Record<string, string>,
        )
      : replaceTemplateVariables(
          template.smsMessage,
          (notification.data || {}) as Record<string, string>,
        );

  console.log("📱 SMS Notification:", {
    to: notification.recipientPhone,
    message: smsMessage,
  });

  // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
  // Example:
  // await smsService.send({
  //   to: notification.recipientPhone,
  //   message: smsMessage,
  // });

  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 150));
}

/**
 * Send notifications to all guardians of an application
 */
export async function notifyGuardians(
  application: Application,
  stage: NotificationStage,
  additionalData: Record<string, string> = {},
): Promise<void> {
  const notifications: Notification[] = [];

  // Create notification for each guardian
  for (const guardian of application.guardians) {
    if (guardian.can_receive_notifications) {
      // Determine language preference (default to English)
      const language: "en" | "ar" = "en"; // In production, get from guardian preferences

      const notification = createNotification(
        stage,
        guardian,
        application.studentName,
        additionalData,
        application.id,
        application.leadId,
        language,
      );

      notifications.push(notification);
    }
  }

  // Send all notifications
  await Promise.all(notifications.map((notif) => sendNotification(notif)));

  console.log(
    `✅ Sent ${notifications.length} notifications for stage: ${stage}`,
  );
}

/**
 * Get notification history for a guardian
 */
export function getGuardianNotifications(guardianId: string): Notification[] {
  const notifications = JSON.parse(
    localStorage.getItem("notifications") || "[]",
  );
  return notifications.filter(
    (notif: Notification) => notif.recipientId === guardianId,
  );
}

/**
 * Mark notification as read
 */
export function markNotificationAsRead(notificationId: string): void {
  const notifications = JSON.parse(
    localStorage.getItem("notifications") || "[]",
  );
  const notification = notifications.find(
    (notif: Notification) => notif.id === notificationId,
  );

  if (notification) {
    notification.readAt = new Date().toISOString();
    notification.status.in_app = "read";
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }
}

/**
 * Get unread notification count for a guardian
 */
export function getUnreadCount(guardianId: string): number {
  const notifications = getGuardianNotifications(guardianId);
  return notifications.filter(
    (notif) => !notif.readAt && notif.status.in_app === "sent",
  ).length;
}
