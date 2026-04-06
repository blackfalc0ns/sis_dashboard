import type { NotificationTemplate } from "@/types/notifications/template";

export type SettingsStatus =
  | "active"
  | "draft"
  | "connected"
  | "disconnected"
  | "needs_attention"
  | "invited"
  | "inactive"
  | "completed"
  | "running"
  | "failed";

export type AuditSeverity = "info" | "warning" | "critical";
export type PermissionAction = "view" | "manage" | "configure" | "export";
export type NotificationChannel = "email" | "sms" | "in_app";
export type IntegrationFieldType = "text" | "password" | "url" | "email" | "select";
export type UserAdminStatus = "active" | "invited" | "inactive";
export type BackupJobStatus = "completed" | "running" | "failed";

export interface SettingsOverviewMetrics {
  profileCompleteness: number;
  activeIntegrations: number;
  activeUsers: number;
  pendingInvites: number;
  recentAuditEvents: number;
  templateHealth: number;
}

export interface SchoolProfileSettings {
  schoolName: string;
  shortName: string;
  timezone: string;
  addressLine: string;
  formattedAddress: string;
  city: string;
  country: string;
  footerSignature: string;
  logoUrl?: string;
  latitude: number | null;
  longitude: number | null;
  mapPlaceLabel?: string;
}

export interface LocationSuggestion {
  id: string;
  label: string;
  formattedAddress: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface ResolvedSchoolLocation {
  label: string;
  formattedAddress: string;
  addressLine: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface PermissionDefinition {
  key: string;
  module: string;
  action: PermissionAction;
  label: string;
  description: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  memberCount: number;
  permissions: string[];
}

export interface AttendancePolicySettings {
  absenceThreshold: number;
  lateThresholdMinutes: number;
  lockTime: string;
  guardianAlertEnabled: boolean;
  portalAbsenceVisible: boolean;
}

export interface GradePolicySettings {
  passingScore: number;
  publishApprovalRequired: boolean;
  allowTeacherDrafts: boolean;
  weightingLockedAfterPublish: boolean;
}

export interface BehaviorPolicySettings {
  incidentThreshold: number;
  suspensionRequiresApproval: boolean;
  guardianNotificationEnabled: boolean;
  studentPortalVisibility: boolean;
}

export interface PolicySettings {
  attendance: AttendancePolicySettings;
  grades: GradePolicySettings;
  behavior: BehaviorPolicySettings;
}

export interface NotificationTemplateChannelState {
  channel: NotificationChannel;
  enabled: boolean;
}

export interface NotificationTemplateConfig {
  id: string;
  key: string;
  name: string;
  status: "active" | "draft";
  variables: string[];
  template: NotificationTemplate;
  channelStates: NotificationTemplateChannelState[];
  lastTestAt?: string;
}

export interface IntegrationProviderField {
  key: string;
  label: string;
  type: IntegrationFieldType;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
}

export interface IntegrationConfiguration {
  providerId: string;
  values: Record<string, string>;
  updatedAt?: string;
}

export interface IntegrationProviderStatus {
  id: string;
  provider: string;
  category: string;
  status: "connected" | "disconnected" | "needs_attention";
  description: string;
  lastCheckedAt: string;
  lastTestAt?: string;
  lastSyncAt?: string;
  healthNote?: string;
  fields: IntegrationProviderField[];
  configuration: IntegrationConfiguration;
}

export interface SecuritySettings {
  enforceTwoFactor: boolean;
  ipAllowlistEnabled: boolean;
  ipAllowlist: string;
  sessionTimeoutMinutes: number;
  suspiciousLoginAlerts: boolean;
  passwordMinLength: number;
  passwordRotationDays: number;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  module: string;
  entity?: string;
  timestamp: string;
  severity: AuditSeverity;
  ipAddress: string;
}

export interface SettingsUserRecord {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  status: UserAdminStatus;
  lastActiveAt?: string;
  invitedAt?: string;
  lastInviteSentAt?: string;
}

export interface SettingsSessionUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
}

export interface BackupHistoryEntry {
  id: string;
  type: "backup" | "export" | "import" | "migration";
  status: BackupJobStatus;
  fileName: string;
  createdAt: string;
  createdBy: string;
  note?: string;
}

export interface AdmissionsRequiredDocumentConfig {
  id: string;
  nameEn: string;
  nameAr: string;
  required: boolean;
  active: boolean;
  sortOrder: number;
}

export interface SettingsStoreSnapshot {
  schoolProfile: SchoolProfileSettings;
  roles: RoleDefinition[];
  policies: PolicySettings;
  admissionsDocuments: AdmissionsRequiredDocumentConfig[];
  notificationTemplates: NotificationTemplateConfig[];
  integrations: IntegrationProviderStatus[];
  securitySettings: SecuritySettings;
  auditLog: AuditLogEntry[];
  users: SettingsUserRecord[];
  backupHistory: BackupHistoryEntry[];
  currentUser: SettingsSessionUser;
}