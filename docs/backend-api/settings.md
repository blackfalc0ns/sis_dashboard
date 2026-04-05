# Settings API Contract

Status: `Service-derived`

Base path: `/settings`

## Main Response Models

```ts
interface SettingsOverviewMetrics {
  profileCompleteness: number;
  activeIntegrations: number;
  activeUsers: number;
  pendingInvites: number;
  recentAuditEvents: number;
  templateHealth: number;
}

interface SchoolProfileSettings {
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

interface PermissionDefinition {
  key: string;
  module: string;
  action: "view" | "manage" | "configure" | "export";
  label: string;
  description: string;
}

interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  memberCount: number;
  permissions: string[];
}

interface NotificationTemplateConfig {
  id: string;
  key: string;
  name: string;
  status: "active" | "draft";
  variables: string[];
  template: unknown;
  channelStates: Array<{
    channel: "email" | "sms" | "in_app";
    enabled: boolean;
  }>;
  lastTestAt?: string;
}

interface IntegrationProviderStatus {
  id: string;
  provider: string;
  category: string;
  status: "connected" | "disconnected" | "needs_attention";
  description: string;
  lastCheckedAt: string;
  lastTestAt?: string;
  lastSyncAt?: string;
  healthNote?: string;
  fields: Array<{
    key: string;
    label: string;
    type: "text" | "password" | "url" | "email" | "select";
  }>;
  configuration: {
    providerId: string;
    values: Record<string, string>;
    updatedAt?: string;
  };
}

interface SecuritySettings {
  enforceTwoFactor: boolean;
  ipAllowlistEnabled: boolean;
  ipAllowlist: string;
  sessionTimeoutMinutes: number;
  suspiciousLoginAlerts: boolean;
  passwordMinLength: number;
  passwordRotationDays: number;
}

interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  module: string;
  entity?: string;
  timestamp: string;
  severity: "info" | "warning" | "critical";
  ipAddress: string;
}

interface SettingsUserRecord {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  status: "active" | "invited" | "inactive";
  lastActiveAt?: string;
  invitedAt?: string;
  lastInviteSentAt?: string;
}

interface BackupHistoryEntry {
  id: string;
  type: "backup" | "export" | "import" | "migration";
  status: "completed" | "running" | "failed";
  fileName: string;
  createdAt: string;
  createdBy: string;
  note?: string;
}
```

## Request DTOs

```ts
interface InviteUserRequest {
  fullName: string;
  email: string;
  roleId: string;
}

interface CreateRoleRequest {
  name: string;
  description: string;
}

interface UpdateRolePermissionsRequest {
  permissions: string[];
}

interface UpdateIntegrationConfigurationRequest {
  values: Record<string, string>;
}

interface CreateBackupJobRequest {
  type: "backup" | "export" | "import" | "migration";
  note?: string;
}
```

## Endpoints

### Session and Overview

| Method | Path                 | Request               | Response                                   |
| ------ | -------------------- | --------------------- | ------------------------------------------ |
| `POST` | `/auth/login`        | `{ email, password }` | `{ accessToken, refreshToken, user }`      |
| `GET`  | `/auth/me`           | none                  | `{ id, name, email, roleId, permissions }` |
| `GET`  | `/settings/overview` | none                  | `SettingsOverviewMetrics`                  |

### Branding and School Profile

| Method  | Path                 | Request                 | Response                |
| ------- | -------------------- | ----------------------- | ----------------------- |
| `GET`   | `/settings/branding` | none                    | `SchoolProfileSettings` |
| `PATCH` | `/settings/branding` | `SchoolProfileSettings` | `SchoolProfileSettings` |

### Roles and Permissions

| Method   | Path                              | Request                        | Response                 |
| -------- | --------------------------------- | ------------------------------ | ------------------------ |
| `GET`    | `/settings/roles`                 | none                           | `RoleDefinition[]`       |
| `POST`   | `/settings/roles`                 | `CreateRoleRequest`            | `RoleDefinition`         |
| `POST`   | `/settings/roles/:id/clone`       | `{ name: string }`             | `RoleDefinition`         |
| `PATCH`  | `/settings/roles/:id`             | `CreateRoleRequest`            | `RoleDefinition`         |
| `DELETE` | `/settings/roles/:id`             | none                           | `void`                   |
| `PATCH`  | `/settings/roles/:id/permissions` | `UpdateRolePermissionsRequest` | `RoleDefinition`         |
| `GET`    | `/settings/permissions`           | none                           | `PermissionDefinition[]` |

### School Policy Settings

| Method  | Path                 | Request          | Response         |
| ------- | -------------------- | ---------------- | ---------------- |
| `GET`   | `/settings/policies` | none             | `PolicySettings` |
| `PATCH` | `/settings/policies` | `PolicySettings` | `PolicySettings` |

### Notification Templates

| Method  | Path                           | Request                      | Response                       |
| ------- | ------------------------------ | ---------------------------- | ------------------------------ |
| `GET`   | `/settings/templates`          | none                         | `NotificationTemplateConfig[]` |
| `PATCH` | `/settings/templates/:id`      | `NotificationTemplateConfig` | `NotificationTemplateConfig`   |
| `POST`  | `/settings/templates/:id/test` | empty body                   | `NotificationTemplateConfig`   |

### Integrations

| Method  | Path                              | Request                                 | Response                      |
| ------- | --------------------------------- | --------------------------------------- | ----------------------------- |
| `GET`   | `/settings/integrations`          | none                                    | `IntegrationProviderStatus[]` |
| `GET`   | `/settings/integrations/:id`      | none                                    | `IntegrationProviderStatus`   |
| `PATCH` | `/settings/integrations/:id`      | `UpdateIntegrationConfigurationRequest` | `IntegrationProviderStatus`   |
| `POST`  | `/settings/integrations/:id/test` | empty body                              | `IntegrationProviderStatus`   |

### Security and Audit

| Method  | Path                   | Request                                 | Response           |
| ------- | ---------------------- | --------------------------------------- | ------------------ |
| `GET`   | `/settings/security`   | none                                    | `SecuritySettings` |
| `PATCH` | `/settings/security`   | `SecuritySettings`                      | `SecuritySettings` |
| `GET`   | `/settings/audit-logs` | query: `severity?`, `module?`, `limit?` | `AuditLogEntry[]`  |

### Users

| Method  | Path                                 | Request                       | Response               |
| ------- | ------------------------------------ | ----------------------------- | ---------------------- | ------------- | -------------------- |
| `GET`   | `/settings/users`                    | none                          | `SettingsUserRecord[]` |
| `POST`  | `/settings/users/invite`             | `InviteUserRequest`           | `SettingsUserRecord`   |
| `POST`  | `/settings/users`                    | `InviteUserRequest`           | `SettingsUserRecord`   |
| `PATCH` | `/settings/users/:id`                | `Partial<SettingsUserRecord>` | `SettingsUserRecord`   |
| `PATCH` | `/settings/users/:id/status`         | `{ status: "active"           | "invited"              | "inactive" }` | `SettingsUserRecord` |
| `POST`  | `/settings/users/:id/resend-invite`  | empty body                    | `SettingsUserRecord`   |
| `POST`  | `/settings/users/:id/reset-password` | empty body                    | `{ success: true }`    |

### Backup and Migration

| Method | Path                       | Request                              | Response               |
| ------ | -------------------------- | ------------------------------------ | ---------------------- |
| `GET`  | `/settings/backup/history` | none                                 | `BackupHistoryEntry[]` |
| `POST` | `/settings/backup/jobs`    | `CreateBackupJobRequest`             | `BackupHistoryEntry`   |
| `POST` | `/settings/backup/import`  | `{ note? }` or `multipart/form-data` | `BackupHistoryEntry`   |
| `POST` | `/settings/backup/export`  | `{ note? }`                          | `BackupHistoryEntry`   |

## Notes

- The current frontend supports a "switch user" action for settings pages; if you do not want to expose that in production, keep it behind admin-only controls.
- Integration values should be masked on list endpoints when the field type is `password`.
