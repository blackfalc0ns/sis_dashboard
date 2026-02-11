// FILE: src/api/admissionsNotifications.ts

import { Application, Test, Interview, Decision } from "@/types/admissions";
import { notifyGuardians } from "@/services/notificationService";

/**
 * Trigger notification when lead is created
 */
export async function notifyLeadCreated(
  guardianName: string,
  guardianEmail: string,
  guardianPhone: string,
  studentName: string,
  leadId: string,
): Promise<void> {
  // Create a minimal guardian object for notification
  const guardian = {
    id: leadId,
    full_name: guardianName,
    email: guardianEmail,
    phone_primary: guardianPhone,
    can_receive_notifications: true,
    relation: "parent",
    phone_secondary: "",
    national_id: "",
    job_title: "",
    workplace: "",
    is_primary: true,
    can_pickup: true,
  };

  const application = {
    guardians: [guardian],
    studentName,
    leadId,
  } as Application;

  await notifyGuardians(application, "lead_created");
}

/**
 * Trigger notification when lead is contacted
 */
export async function notifyLeadContacted(
  application: Application,
): Promise<void> {
  await notifyGuardians(application, "lead_contacted");
}

/**
 * Trigger notification when application is submitted
 */
export async function notifyApplicationSubmitted(
  application: Application,
): Promise<void> {
  await notifyGuardians(application, "application_submitted", {
    applicationId: application.id,
  });
}

/**
 * Trigger notification when documents are pending
 */
export async function notifyDocumentsPending(
  application: Application,
): Promise<void> {
  const missingDocs = application.documents
    .filter((doc) => doc.status === "missing")
    .map((doc) => doc.type)
    .join(", ");

  await notifyGuardians(application, "documents_pending", {
    applicationId: application.id,
    missingDocuments: missingDocs,
  });
}

/**
 * Trigger notification when all documents are complete
 */
export async function notifyDocumentsComplete(
  application: Application,
): Promise<void> {
  await notifyGuardians(application, "documents_complete", {
    applicationId: application.id,
  });
}

/**
 * Trigger notification when test is scheduled
 */
export async function notifyTestScheduled(
  application: Application,
  test: Test,
): Promise<void> {
  await notifyGuardians(application, "test_scheduled", {
    applicationId: application.id,
    testType: test.subject,
    testDate: new Date(test.date).toLocaleDateString(),
    testTime: test.time,
    testLocation: test.location,
  });
}

/**
 * Trigger notification when test is completed
 */
export async function notifyTestCompleted(
  application: Application,
  test: Test,
): Promise<void> {
  await notifyGuardians(application, "test_completed", {
    applicationId: application.id,
    testType: test.subject,
    testScore: test.score?.toString() || "N/A",
    maxScore: test.maxScore?.toString() || "100",
  });
}

/**
 * Trigger notification when interview is scheduled
 */
export async function notifyInterviewScheduled(
  application: Application,
  interview: Interview,
): Promise<void> {
  await notifyGuardians(application, "interview_scheduled", {
    applicationId: application.id,
    interviewDate: new Date(interview.date).toLocaleDateString(),
    interviewTime: interview.time,
    interviewer: interview.interviewer,
    interviewLocation: interview.location,
  });
}

/**
 * Trigger notification when interview is completed
 */
export async function notifyInterviewCompleted(
  application: Application,
): Promise<void> {
  await notifyGuardians(application, "interview_completed", {
    applicationId: application.id,
  });
}

/**
 * Trigger notification when application is under review
 */
export async function notifyUnderReview(
  application: Application,
): Promise<void> {
  await notifyGuardians(application, "under_review", {
    applicationId: application.id,
  });
}

/**
 * Trigger notification when decision is made
 */
export async function notifyDecision(
  application: Application,
  decision: Decision,
): Promise<void> {
  const stage =
    decision.decision === "accept"
      ? "decision_accepted"
      : decision.decision === "waitlist"
        ? "decision_waitlisted"
        : "decision_rejected";

  const additionalData: Record<string, string> = {
    applicationId: application.id,
    grade: application.gradeRequested,
    academicYear: "2024-2025",
    reason: decision.reason,
  };

  if (decision.decision === "accept") {
    additionalData.enrollmentDeadline = "March 15, 2024";
  }

  if (decision.decision === "waitlist") {
    additionalData.waitlistPosition = "5"; // In production, calculate actual position
  }

  await notifyGuardians(application, stage, additionalData);
}

/**
 * Trigger notification when enrollment is complete
 */
export async function notifyEnrollmentComplete(
  application: Application,
  enrollmentData: {
    grade: string;
    section: string;
    academicYear: string;
    startDate: string;
  },
): Promise<void> {
  await notifyGuardians(application, "enrollment_complete", {
    applicationId: application.id,
    grade: enrollmentData.grade,
    section: enrollmentData.section,
    academicYear: enrollmentData.academicYear,
    startDate: new Date(enrollmentData.startDate).toLocaleDateString(),
  });
}
