import type {
  AdmissionsRequiredDocumentConfig,
  AuditLogEntry,
  BackupHistoryEntry,
  IntegrationProviderStatus,
  NotificationTemplateConfig,
  PolicySettings,
  RoleDefinition,
  SchoolProfileSettings,
  SecuritySettings,
  SettingsSessionUser,
  SettingsUserRecord,
} from "@/features/settings/types";

export const timezones = [
  "Africa/Cairo",
  "Asia/Riyadh",
  "Asia/Dubai",
  "Europe/London",
  "UTC",
];

export const defaultSchoolProfileSettings: SchoolProfileSettings = {
  schoolName: "Moazzez International School",
  shortName: "MIS",
  timezone: "Africa/Cairo",
  addressLine: "North 90 Street, New Cairo",
  formattedAddress:
    "North 90 Street, Fifth Settlement, New Cairo, Cairo Governorate, Egypt",
  city: "Cairo",
  country: "Egypt",
  footerSignature: "Moazzez School Management Platform",
  logoUrl: "",
  latitude: 30.0284,
  longitude: 31.4913,
  mapPlaceLabel: "Moazzez International School",
};

export const defaultRoles: RoleDefinition[] = [
  {
    id: "role-admin",
    name: "System Admin",
    description: "Full administrative access across settings and operations.",
    isSystem: true,
    memberCount: 2,
    permissions: [
      "settings.branding.view",
      "settings.branding.manage",
      "settings.users.view",
      "settings.users.manage",
      "settings.roles.view",
      "settings.roles.manage",
      "settings.policies.view",
      "settings.policies.manage",
      "settings.admissionsDocuments.view",
      "settings.admissionsDocuments.manage",
      "settings.templates.view",
      "settings.templates.manage",
      "settings.integrations.view",
      "settings.integrations.configure",
      "settings.security.view",
      "settings.security.manage",
      "settings.backup.view",
      "settings.backup.manage",
      "settings.overview.view",
      "nedaa.overview.view",
      "nedaa.requests.view",
      "nedaa.requests.manage",
      "nedaa.settings.view",
      "nedaa.settings.manage",
    ],
  },
  {
    id: "role-coordinator",
    name: "Operations Coordinator",
    description: "Manages policies, templates, and profile-level settings.",
    isSystem: true,
    memberCount: 3,
    permissions: [
      "settings.overview.view",
      "settings.branding.view",
      "settings.branding.manage",
      "settings.policies.view",
      "settings.policies.manage",
      "settings.admissionsDocuments.view",
      "settings.admissionsDocuments.manage",
      "settings.templates.view",
      "settings.templates.manage",
      "settings.users.view",
      "nedaa.overview.view",
      "nedaa.requests.view",
      "nedaa.requests.manage",
      "nedaa.settings.view",
      "nedaa.settings.manage",
    ],
  },
  {
    id: "role-it",
    name: "IT Supervisor",
    description: "Owns integrations, security controls, and backup workflows.",
    isSystem: true,
    memberCount: 2,
    permissions: [
      "settings.overview.view",
      "settings.integrations.view",
      "settings.integrations.configure",
      "settings.security.view",
      "settings.security.manage",
      "settings.backup.view",
      "settings.backup.manage",
      "settings.users.view",
    ],
  },
];

export const defaultUsers: SettingsUserRecord[] = [
  {
    id: "settings-user-1",
    fullName: "Ahmed Mostafa",
    email: "ahmed@moazzez.edu",
    roleId: "role-admin",
    status: "active",
    lastActiveAt: "2026-03-23T08:35:00Z",
  },
  {
    id: "settings-user-2",
    fullName: "Mariam Adel",
    email: "mariam@moazzez.edu",
    roleId: "role-coordinator",
    status: "active",
    lastActiveAt: "2026-03-22T14:10:00Z",
  },
  {
    id: "settings-user-3",
    fullName: "Omar Fathy",
    email: "omar@moazzez.edu",
    roleId: "role-it",
    status: "active",
    lastActiveAt: "2026-03-22T09:40:00Z",
  },
  {
    id: "settings-user-4",
    fullName: "Nour Hassan",
    email: "nour@moazzez.edu",
    roleId: "role-coordinator",
    status: "invited",
    invitedAt: "2026-03-21T12:15:00Z",
    lastInviteSentAt: "2026-03-21T12:15:00Z",
  },
];

export const defaultCurrentSettingsUser: SettingsSessionUser = {
  id: "settings-user-1",
  name: "Ahmed Mostafa",
  email: "ahmed@moazzez.edu",
  roleId: "role-admin",
};

export const defaultPolicies: PolicySettings = {
  attendance: {
    absenceThreshold: 3,
    lateThresholdMinutes: 10,
    lockTime: "09:00",
    guardianAlertEnabled: true,
    portalAbsenceVisible: true,
  },
  grades: {
    passingScore: 50,
    publishApprovalRequired: true,
    allowTeacherDrafts: true,
    weightingLockedAfterPublish: true,
  },
  behavior: {
    incidentThreshold: 4,
    suspensionRequiresApproval: true,
    guardianNotificationEnabled: true,
    studentPortalVisibility: false,
  },
};

export const defaultAdmissionsDocumentRequirements: AdmissionsRequiredDocumentConfig[] =
  [
    {
      id: "birth-certificate",
      nameEn: "Birth Certificate",
      nameAr: "شهادة الميلاد",
      required: true,
      active: true,
      sortOrder: 1,
    },
    {
      id: "passport-copy",
      nameEn: "Passport Copy",
      nameAr: "نسخة جواز السفر",
      required: true,
      active: true,
      sortOrder: 2,
    },
    {
      id: "medical-report",
      nameEn: "Medical Report",
      nameAr: "التقرير الطبي",
      required: false,
      active: true,
      sortOrder: 3,
    },
    {
      id: "previous-school-certificate",
      nameEn: "Previous School Certificate",
      nameAr: "شهادة المدرسة السابقة",
      required: false,
      active: true,
      sortOrder: 4,
    },
  ];

export const defaultNotificationTemplates: NotificationTemplateConfig[] = [
  {
    id: "template-attendance-alert",
    key: "attendance_alert",
    name: "Attendance Alert",
    status: "active",
    variables: ["student_name", "date", "status"],
    channelStates: [
      { channel: "email", enabled: true },
      { channel: "sms", enabled: true },
      { channel: "in_app", enabled: true },
    ],
    template: {
      stage: "documents_pending",
      title: "Attendance alert",
      titleAr:
        "ÃƒËœÃ‚ÂªÃƒâ„¢Ã¢â‚¬Â ÃƒËœÃ‚Â¨Ãƒâ„¢Ã…Â Ãƒâ„¢Ã¢â‚¬Â¡ ÃƒËœÃ‚Â­ÃƒËœÃ‚Â¶Ãƒâ„¢Ã‹â€ ÃƒËœÃ‚Â±",
      message: "Attendance alert for {{student_name}} on {{date}}.",
      messageAr:
        "ÃƒËœÃ‚ÂªÃƒâ„¢Ã¢â‚¬Â ÃƒËœÃ‚Â¨Ãƒâ„¢Ã…Â Ãƒâ„¢Ã¢â‚¬Â¡ ÃƒËœÃ‚Â­ÃƒËœÃ‚Â¶Ãƒâ„¢Ã‹â€ ÃƒËœÃ‚Â± Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â·ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â¨ {{student_name}} ÃƒËœÃ‚Â¨ÃƒËœÃ‚ÂªÃƒËœÃ‚Â§ÃƒËœÃ‚Â±Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â® {{date}}.",
      emailSubject: "Attendance alert",
      emailSubjectAr:
        "ÃƒËœÃ‚ÂªÃƒâ„¢Ã¢â‚¬Â ÃƒËœÃ‚Â¨Ãƒâ„¢Ã…Â Ãƒâ„¢Ã¢â‚¬Â¡ ÃƒËœÃ‚Â­ÃƒËœÃ‚Â¶Ãƒâ„¢Ã‹â€ ÃƒËœÃ‚Â±",
      smsMessage: "{{student_name}} was marked {{status}} on {{date}}.",
      smsMessageAr:
        "ÃƒËœÃ‚ÂªÃƒâ„¢Ã¢â‚¬Â¦ ÃƒËœÃ‚ÂªÃƒËœÃ‚Â³ÃƒËœÃ‚Â¬Ãƒâ„¢Ã…Â Ãƒâ„¢Ã¢â‚¬Å¾ {{student_name}} ÃƒËœÃ‚Â¨ÃƒËœÃ‚Â­ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â© {{status}} ÃƒËœÃ‚Â¨ÃƒËœÃ‚ÂªÃƒËœÃ‚Â§ÃƒËœÃ‚Â±Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â® {{date}}.",
      channels: ["email", "sms", "in_app"],
      priority: "high",
    },
    lastTestAt: "2026-03-20T09:10:00Z",
  },
  {
    id: "template-fee-reminder",
    key: "fee_reminder",
    name: "Fee Reminder",
    status: "draft",
    variables: ["guardian_name", "amount_due", "due_date"],
    channelStates: [
      { channel: "email", enabled: true },
      { channel: "sms", enabled: true },
      { channel: "in_app", enabled: false },
    ],
    template: {
      stage: "enrollment_complete",
      title: "Fee reminder",
      titleAr:
        "ÃƒËœÃ‚ÂªÃƒËœÃ‚Â°Ãƒâ„¢Ã†â€™Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â± ÃƒËœÃ‚Â±ÃƒËœÃ‚Â³Ãƒâ„¢Ã‹â€ Ãƒâ„¢Ã¢â‚¬Â¦",
      message:
        "Dear {{guardian_name}}, your due amount is {{amount_due}} before {{due_date}}.",
      messageAr:
        "ÃƒËœÃ‚Â¹ÃƒËœÃ‚Â²Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â²Ãƒâ„¢Ã…Â  {{guardian_name}}ÃƒËœÃ…â€™ ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â¨Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Âº ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â³ÃƒËœÃ‚ÂªÃƒËœÃ‚Â­Ãƒâ„¢Ã¢â‚¬Å¡ {{amount_due}} Ãƒâ„¢Ã¢â‚¬Å¡ÃƒËœÃ‚Â¨Ãƒâ„¢Ã¢â‚¬Å¾ {{due_date}}.",
      emailSubject: "School fee reminder",
      emailSubjectAr:
        "ÃƒËœÃ‚ÂªÃƒËœÃ‚Â°Ãƒâ„¢Ã†â€™Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â± ÃƒËœÃ‚Â±ÃƒËœÃ‚Â³Ãƒâ„¢Ã‹â€ Ãƒâ„¢Ã¢â‚¬Â¦ ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â¯ÃƒËœÃ‚Â±ÃƒËœÃ‚Â³ÃƒËœÃ‚Â©",
      smsMessage: "Reminder: {{amount_due}} due before {{due_date}}.",
      smsMessageAr:
        "ÃƒËœÃ‚ÂªÃƒËœÃ‚Â°Ãƒâ„¢Ã†â€™Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â±: {{amount_due}} Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â³ÃƒËœÃ‚ÂªÃƒËœÃ‚Â­Ãƒâ„¢Ã¢â‚¬Å¡ Ãƒâ„¢Ã¢â‚¬Å¡ÃƒËœÃ‚Â¨Ãƒâ„¢Ã¢â‚¬Å¾ {{due_date}}.",
      channels: ["email", "sms"],
      priority: "medium",
    },
  },
];

export const defaultIntegrations: IntegrationProviderStatus[] = [
  {
    id: "integration-sms",
    provider: "SMS / WhatsApp Gateway",
    category: "Messaging",
    status: "connected",
    description: "Primary outbound provider for alerts and OTP traffic.",
    lastCheckedAt: "2026-03-23T07:40:00Z",
    lastTestAt: "2026-03-22T18:10:00Z",
    lastSyncAt: "2026-03-23T07:39:00Z",
    healthNote: "Healthy",
    fields: [
      { key: "baseUrl", label: "Base URL", type: "url", required: true },
      { key: "apiKey", label: "API Key", type: "password", required: true },
      { key: "senderId", label: "Sender ID", type: "text", required: true },
    ],
    configuration: {
      providerId: "integration-sms",
      values: {
        baseUrl: "https://sms.example.com",
        apiKey: "sk_live_sms_123456",
        senderId: "MISchool",
      },
      updatedAt: "2026-03-20T08:20:00Z",
    },
  },
  {
    id: "integration-email",
    provider: "Email SMTP",
    category: "Email",
    status: "connected",
    description: "Transactional and bulk email delivery provider.",
    lastCheckedAt: "2026-03-23T07:20:00Z",
    lastTestAt: "2026-03-22T17:10:00Z",
    healthNote: "Healthy",
    fields: [
      { key: "host", label: "SMTP Host", type: "text", required: true },
      { key: "username", label: "Username", type: "email", required: true },
      { key: "password", label: "Password", type: "password", required: true },
    ],
    configuration: {
      providerId: "integration-email",
      values: {
        host: "smtp.moazzez.edu",
        username: "notifications@moazzez.edu",
        password: "super-secret-password",
      },
      updatedAt: "2026-03-20T08:15:00Z",
    },
  },
  {
    id: "integration-payment",
    provider: "Payments",
    category: "Payment Gateway",
    status: "needs_attention",
    description: "Fee collection integration pending webhook verification.",
    lastCheckedAt: "2026-03-22T18:40:00Z",
    fields: [
      { key: "merchantId", label: "Merchant ID", type: "text", required: true },
      {
        key: "secretKey",
        label: "Secret Key",
        type: "password",
        required: true,
      },
      { key: "webhookUrl", label: "Webhook URL", type: "url", required: true },
    ],
    configuration: {
      providerId: "integration-payment",
      values: {
        merchantId: "moazzez-merchant",
        secretKey: "payment-secret-1234",
        webhookUrl: "https://school.example.com/payments/webhook",
      },
      updatedAt: "2026-03-19T18:40:00Z",
    },
    healthNote: "Webhook signature mismatch detected.",
  },
  {
    id: "integration-sso",
    provider: "SSO Provider",
    category: "SSO",
    status: "disconnected",
    description: "Single sign-on provider not configured yet.",
    lastCheckedAt: "2026-03-18T11:00:00Z",
    fields: [
      { key: "issuerUrl", label: "Issuer URL", type: "url", required: true },
      { key: "clientId", label: "Client ID", type: "text", required: true },
      {
        key: "clientSecret",
        label: "Client Secret",
        type: "password",
        required: true,
      },
    ],
    configuration: {
      providerId: "integration-sso",
      values: {},
    },
  },
  {
    id: "integration-lms",
    provider: "LMS Connector",
    category: "LMS",
    status: "connected",
    description: "Synchronizes roster and section data with the LMS.",
    lastCheckedAt: "2026-03-23T07:00:00Z",
    lastSyncAt: "2026-03-23T06:45:00Z",
    fields: [
      { key: "endpoint", label: "API Endpoint", type: "url", required: true },
      { key: "token", label: "Access Token", type: "password", required: true },
    ],
    configuration: {
      providerId: "integration-lms",
      values: {
        endpoint: "https://lms.example.com/api",
        token: "lms-token-987654",
      },
      updatedAt: "2026-03-20T07:45:00Z",
    },
    healthNote: "Healthy",
  },
];

export const defaultSecuritySettings: SecuritySettings = {
  enforceTwoFactor: true,
  ipAllowlistEnabled: false,
  ipAllowlist: "",
  sessionTimeoutMinutes: 30,
  suspiciousLoginAlerts: true,
  passwordMinLength: 10,
  passwordRotationDays: 90,
};

export const defaultAuditLogEntries: AuditLogEntry[] = [
  {
    id: "audit-1",
    actor: "Ahmed Mostafa",
    action: "Updated grading policy thresholds",
    module: "Policies",
    entity: "grades-policy",
    timestamp: "2026-03-21T09:30:00Z",
    severity: "warning",
    ipAddress: "10.0.0.24",
  },
  {
    id: "audit-2",
    actor: "System Admin",
    action: "Enabled SMTP integration",
    module: "Integrations",
    entity: "integration-email",
    timestamp: "2026-03-20T14:05:00Z",
    severity: "info",
    ipAddress: "10.0.0.12",
  },
  {
    id: "audit-3",
    actor: "IT Supervisor",
    action: "Suspicious login alert acknowledged",
    module: "Security",
    entity: "suspicious-login",
    timestamp: "2026-03-20T11:45:00Z",
    severity: "critical",
    ipAddress: "10.0.0.44",
  },
  {
    id: "audit-4",
    actor: "Operations Coordinator",
    action: "Edited Attendance Alert template",
    module: "Templates",
    entity: "template-attendance-alert",
    timestamp: "2026-03-19T16:20:00Z",
    severity: "info",
    ipAddress: "10.0.0.31",
  },
];

export const defaultBackupHistory: BackupHistoryEntry[] = [
  {
    id: "backup-1",
    type: "backup",
    status: "completed",
    fileName: "settings-backup-2026-03-20.json",
    createdAt: "2026-03-20T04:00:00Z",
    createdBy: "Ahmed Mostafa",
    note: "Nightly settings snapshot",
  },
  {
    id: "backup-2",
    type: "export",
    status: "completed",
    fileName: "settings-export-2026-03-22.json",
    createdAt: "2026-03-22T12:10:00Z",
    createdBy: "Ahmed Mostafa",
    note: "Manual export before policy update",
  },
];
