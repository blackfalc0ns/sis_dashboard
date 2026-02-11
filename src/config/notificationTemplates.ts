// FILE: src/config/notificationTemplates.ts

import { NotificationTemplate } from "@/types/notifications";

export const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  lead_created: {
    stage: "lead_created",
    title: "Thank You for Your Interest",
    titleAr: "شكراً لاهتمامك",
    message:
      "Thank you for your interest in our school. We have received your inquiry for {studentName} and our admissions team will contact you shortly.",
    messageAr:
      "شكراً لاهتمامك بمدرستنا. لقد استلمنا استفسارك عن {studentName} وسيتواصل معك فريق القبول قريباً.",
    emailSubject: "Thank You for Your Interest - {schoolName}",
    emailSubjectAr: "شكراً لاهتمامك - {schoolName}",
    smsMessage:
      "Thank you for your interest in {schoolName}. We will contact you soon regarding {studentName}'s admission.",
    smsMessageAr:
      "شكراً لاهتمامك بـ {schoolName}. سنتواصل معك قريباً بخصوص قبول {studentName}.",
    channels: ["in_app", "email", "sms"],
    priority: "medium",
  },

  lead_contacted: {
    stage: "lead_contacted",
    title: "Follow-up on Your Inquiry",
    titleAr: "متابعة استفسارك",
    message:
      "Our admissions team has attempted to contact you regarding {studentName}'s application. Please check your email or phone for our message.",
    messageAr:
      "حاول فريق القبول التواصل معك بخصوص طلب {studentName}. يرجى التحقق من بريدك الإلكتروني أو هاتفك.",
    emailSubject: "Follow-up: {studentName}'s Admission Inquiry",
    emailSubjectAr: "متابعة: استفسار قبول {studentName}",
    smsMessage:
      "We tried to reach you about {studentName}'s admission. Please call us at {schoolPhone}.",
    smsMessageAr:
      "حاولنا التواصل معك بخصوص قبول {studentName}. يرجى الاتصال بنا على {schoolPhone}.",
    channels: ["in_app", "email", "sms"],
    priority: "medium",
  },

  application_submitted: {
    stage: "application_submitted",
    title: "Application Received Successfully",
    titleAr: "تم استلام الطلب بنجاح",
    message:
      "We have successfully received the application for {studentName} (Application ID: {applicationId}). Our team will review it and contact you with next steps.",
    messageAr:
      "لقد استلمنا طلب {studentName} بنجاح (رقم الطلب: {applicationId}). سيقوم فريقنا بمراجعته والتواصل معك بالخطوات التالية.",
    emailSubject: "Application Received - {studentName} ({applicationId})",
    emailSubjectAr: "تم استلام الطلب - {studentName} ({applicationId})",
    smsMessage:
      "Application {applicationId} for {studentName} received successfully. We will contact you soon.",
    smsMessageAr:
      "تم استلام الطلب {applicationId} لـ {studentName} بنجاح. سنتواصل معك قريباً.",
    channels: ["in_app", "email", "sms"],
    priority: "high",
  },

  documents_pending: {
    stage: "documents_pending",
    title: "Documents Required",
    titleAr: "مستندات مطلوبة",
    message:
      "To proceed with {studentName}'s application ({applicationId}), please upload the following documents: {missingDocuments}. You can upload them through your parent portal.",
    messageAr:
      "لمتابعة طلب {studentName} ({applicationId})، يرجى تحميل المستندات التالية: {missingDocuments}. يمكنك تحميلها عبر بوابة أولياء الأمور.",
    emailSubject: "Action Required: Documents Needed - {applicationId}",
    emailSubjectAr: "إجراء مطلوب: مستندات مطلوبة - {applicationId}",
    smsMessage:
      "Documents needed for {studentName}'s application. Please check your email or parent portal.",
    smsMessageAr:
      "مستندات مطلوبة لطلب {studentName}. يرجى التحقق من بريدك الإلكتروني أو بوابة أولياء الأمور.",
    channels: ["in_app", "email", "sms"],
    priority: "high",
  },

  documents_complete: {
    stage: "documents_complete",
    title: "All Documents Received",
    titleAr: "تم استلام جميع المستندات",
    message:
      "Thank you! We have received all required documents for {studentName}'s application ({applicationId}). Your application is now under review.",
    messageAr:
      "شكراً! لقد استلمنا جميع المستندات المطلوبة لطلب {studentName} ({applicationId}). طلبك الآن قيد المراجعة.",
    emailSubject: "Documents Complete - {studentName} ({applicationId})",
    emailSubjectAr: "اكتملت المستندات - {studentName} ({applicationId})",
    smsMessage:
      "All documents received for {studentName}. Application now under review.",
    smsMessageAr:
      "تم استلام جميع المستندات لـ {studentName}. الطلب قيد المراجعة.",
    channels: ["in_app", "email"],
    priority: "medium",
  },

  test_scheduled: {
    stage: "test_scheduled",
    title: "Placement Test Scheduled",
    titleAr: "تم جدولة اختبار تحديد المستوى",
    message:
      "{studentName}'s {testType} test has been scheduled for {testDate} at {testTime}. Location: {testLocation}. Please arrive 15 minutes early.",
    messageAr:
      "تم جدولة اختبار {testType} لـ {studentName} في {testDate} الساعة {testTime}. الموقع: {testLocation}. يرجى الحضور قبل 15 دقيقة.",
    emailSubject: "Test Scheduled - {studentName} ({applicationId})",
    emailSubjectAr: "تم جدولة الاختبار - {studentName} ({applicationId})",
    smsMessage:
      "{studentName}'s test: {testDate} at {testTime}, {testLocation}. Arrive 15 min early.",
    smsMessageAr:
      "اختبار {studentName}: {testDate} الساعة {testTime}، {testLocation}. احضر قبل 15 دقيقة.",
    channels: ["in_app", "email", "sms"],
    priority: "high",
  },

  test_completed: {
    stage: "test_completed",
    title: "Test Completed",
    titleAr: "تم إكمال الاختبار",
    message:
      "{studentName} has completed the {testType} test. Score: {testScore}/{maxScore}. The admissions team will review the results.",
    messageAr:
      "أكمل {studentName} اختبار {testType}. النتيجة: {testScore}/{maxScore}. سيقوم فريق القبول بمراجعة النتائج.",
    emailSubject: "Test Results - {studentName} ({applicationId})",
    emailSubjectAr: "نتائج الاختبار - {studentName} ({applicationId})",
    smsMessage:
      "{studentName} completed {testType}. Score: {testScore}/{maxScore}.",
    smsMessageAr:
      "أكمل {studentName} {testType}. النتيجة: {testScore}/{maxScore}.",
    channels: ["in_app", "email"],
    priority: "medium",
  },

  interview_scheduled: {
    stage: "interview_scheduled",
    title: "Interview Scheduled",
    titleAr: "تم جدولة المقابلة",
    message:
      "An interview has been scheduled for {studentName} on {interviewDate} at {interviewTime}. Interviewer: {interviewer}. Location: {interviewLocation}.",
    messageAr:
      "تم جدولة مقابلة لـ {studentName} في {interviewDate} الساعة {interviewTime}. المقابل: {interviewer}. الموقع: {interviewLocation}.",
    emailSubject: "Interview Scheduled - {studentName} ({applicationId})",
    emailSubjectAr: "تم جدولة المقابلة - {studentName} ({applicationId})",
    smsMessage:
      "Interview for {studentName}: {interviewDate} at {interviewTime}, {interviewLocation}.",
    smsMessageAr:
      "مقابلة {studentName}: {interviewDate} الساعة {interviewTime}، {interviewLocation}.",
    channels: ["in_app", "email", "sms"],
    priority: "high",
  },

  interview_completed: {
    stage: "interview_completed",
    title: "Interview Completed",
    titleAr: "تم إكمال المقابلة",
    message:
      "Thank you for attending the interview for {studentName}. The admissions committee will review all materials and notify you of the decision soon.",
    messageAr:
      "شكراً لحضور مقابلة {studentName}. ستقوم لجنة القبول بمراجعة جميع المواد وإخطارك بالقرار قريباً.",
    emailSubject: "Interview Complete - {studentName} ({applicationId})",
    emailSubjectAr: "اكتملت المقابلة - {studentName} ({applicationId})",
    smsMessage:
      "Interview completed for {studentName}. Decision will be communicated soon.",
    smsMessageAr: "اكتملت مقابلة {studentName}. سيتم إبلاغك بالقرار قريباً.",
    channels: ["in_app", "email"],
    priority: "medium",
  },

  under_review: {
    stage: "under_review",
    title: "Application Under Review",
    titleAr: "الطلب قيد المراجعة",
    message:
      "{studentName}'s application ({applicationId}) is now under review by our admissions committee. We will notify you of the decision within 5-7 business days.",
    messageAr:
      "طلب {studentName} ({applicationId}) الآن قيد المراجعة من قبل لجنة القبول. سنخطرك بالقرار خلال 5-7 أيام عمل.",
    emailSubject: "Application Under Review - {studentName} ({applicationId})",
    emailSubjectAr: "الطلب قيد المراجعة - {studentName} ({applicationId})",
    smsMessage:
      "{studentName}'s application under review. Decision in 5-7 business days.",
    smsMessageAr: "طلب {studentName} قيد المراجعة. القرار خلال 5-7 أيام عمل.",
    channels: ["in_app", "email"],
    priority: "medium",
  },

  decision_accepted: {
    stage: "decision_accepted",
    title: "🎉 Congratulations! Application Accepted",
    titleAr: "🎉 مبروك! تم قبول الطلب",
    message:
      "Congratulations! We are pleased to inform you that {studentName} has been accepted for {grade} for the {academicYear} academic year. Please complete the enrollment process by {enrollmentDeadline}.",
    messageAr:
      "مبروك! يسعدنا إبلاغك بأنه تم قبول {studentName} في {grade} للعام الدراسي {academicYear}. يرجى إكمال عملية التسجيل قبل {enrollmentDeadline}.",
    emailSubject: "🎉 Acceptance Letter - {studentName} ({applicationId})",
    emailSubjectAr: "🎉 خطاب القبول - {studentName} ({applicationId})",
    smsMessage:
      "Congratulations! {studentName} accepted for {grade}. Complete enrollment by {enrollmentDeadline}.",
    smsMessageAr:
      "مبروك! تم قبول {studentName} في {grade}. أكمل التسجيل قبل {enrollmentDeadline}.",
    channels: ["in_app", "email", "sms"],
    priority: "high",
  },

  decision_waitlisted: {
    stage: "decision_waitlisted",
    title: "Application Waitlisted",
    titleAr: "الطلب في قائمة الانتظار",
    message:
      "{studentName}'s application for {grade} has been placed on our waitlist. We will notify you if a spot becomes available. Your position: {waitlistPosition}.",
    messageAr:
      "تم وضع طلب {studentName} لـ {grade} في قائمة الانتظار. سنخطرك إذا أصبح هناك مكان متاح. موقعك: {waitlistPosition}.",
    emailSubject: "Waitlist Status - {studentName} ({applicationId})",
    emailSubjectAr: "حالة قائمة الانتظار - {studentName} ({applicationId})",
    smsMessage:
      "{studentName} waitlisted for {grade}. Position: {waitlistPosition}. We'll notify if spot opens.",
    smsMessageAr:
      "{studentName} في قائمة الانتظار لـ {grade}. الموقع: {waitlistPosition}. سنخطرك إذا توفر مكان.",
    channels: ["in_app", "email", "sms"],
    priority: "high",
  },

  decision_rejected: {
    stage: "decision_rejected",
    title: "Application Decision",
    titleAr: "قرار الطلب",
    message:
      "Thank you for your interest in our school. After careful review, we regret to inform you that we are unable to offer admission to {studentName} for {grade} at this time. {reason}",
    messageAr:
      "شكراً لاهتمامك بمدرستنا. بعد المراجعة الدقيقة، نأسف لإبلاغك بأننا غير قادرين على قبول {studentName} في {grade} في الوقت الحالي. {reason}",
    emailSubject: "Application Decision - {studentName} ({applicationId})",
    emailSubjectAr: "قرار الطلب - {studentName} ({applicationId})",
    smsMessage:
      "Application decision for {studentName} has been made. Please check your email for details.",
    smsMessageAr:
      "تم اتخاذ قرار بشأن طلب {studentName}. يرجى التحقق من بريدك الإلكتروني للتفاصيل.",
    channels: ["in_app", "email"],
    priority: "high",
  },

  enrollment_complete: {
    stage: "enrollment_complete",
    title: "🎓 Enrollment Complete - Welcome!",
    titleAr: "🎓 اكتمل التسجيل - مرحباً بك!",
    message:
      "Welcome to our school family! {studentName} is now enrolled in {grade}, Section {section} for the {academicYear} academic year. School starts on {startDate}.",
    messageAr:
      "مرحباً بك في عائلة مدرستنا! {studentName} الآن مسجل في {grade}، القسم {section} للعام الدراسي {academicYear}. تبدأ المدرسة في {startDate}.",
    emailSubject: "🎓 Welcome to {schoolName} - {studentName}",
    emailSubjectAr: "🎓 مرحباً بك في {schoolName} - {studentName}",
    smsMessage:
      "Welcome! {studentName} enrolled in {grade}, Section {section}. School starts {startDate}.",
    smsMessageAr:
      "مرحباً! {studentName} مسجل في {grade}، القسم {section}. تبدأ المدرسة {startDate}.",
    channels: ["in_app", "email", "sms"],
    priority: "high",
  },
};
