import {
  defaultAdmissionsDocumentRequirements,
  defaultAuditLogEntries,
  defaultBackupHistory,
  defaultCurrentSettingsUser,
  defaultIntegrations,
  defaultNotificationTemplates,
  defaultPolicies,
  defaultRoles,
  defaultSecuritySettings,
  defaultUsers,
} from "@/features/settings/constants/defaults";
import { apiGet } from "@/lib/api";
import { unwrapArrayResponse } from "@/features/admissions/shared/services/admissionsApiUtils";
import type {
  AdmissionRequiredDocument,
  AdmissionsRequiredDocumentConfig,
  AuditLogEntry,
  BackupHistoryEntry,
  IntegrationProviderStatus,
  NotificationTemplateConfig,
  PolicySettings,
  SettingsStoreSnapshot,
} from "@/features/settings/types";

const SETTINGS_STORE_KEY = "sis-dashboard.settings.v2";
const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

type ApiRecord = Record<string, unknown>;

function cloneStore<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(
  record: ApiRecord,
  key: string,
  fallback = "",
): string {
  const value = record[key];
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function readNumber(
  record: ApiRecord,
  key: string,
  fallback: number,
): number {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function readBoolean(record: ApiRecord, key: string): boolean {
  const value = record[key];
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.trim().toLowerCase() === "true";
  return false;
}

function readStringArray(record: ApiRecord, key: string): string[] {
  const value = record[key];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function mapAdmissionRequiredDocument(
  input: unknown,
  index: number,
): AdmissionRequiredDocument {
  if (!isRecord(input)) {
    throw new Error("Invalid admission required document response.");
  }

  const id = readString(input, "id");
  const title = readString(input, "title");

  if (!id || !title) {
    throw new Error("Admission required document response is missing an id or title.");
  }

  return {
    id,
    title,
    description: readString(input, "description"),
    isMandatory: readBoolean(input, "isMandatory"),
    acceptedFileTypes: readStringArray(input, "acceptedFileTypes"),
    maxFiles: Math.max(1, readNumber(input, "maxFiles", 1)),
    sortOrder: readNumber(input, "sortOrder", index + 1),
  };
}

function createDefaultStore(): SettingsStoreSnapshot {
  return {
    roles: cloneStore(defaultRoles),
    policies: cloneStore(defaultPolicies),
    admissionsDocuments: cloneStore(defaultAdmissionsDocumentRequirements),
    notificationTemplates: cloneStore(defaultNotificationTemplates),
    integrations: cloneStore(defaultIntegrations),
    securitySettings: cloneStore(defaultSecuritySettings),
    auditLog: cloneStore(defaultAuditLogEntries),
    users: cloneStore(defaultUsers),
    backupHistory: cloneStore(defaultBackupHistory),
    currentUser: cloneStore(defaultCurrentSettingsUser),
  };
}

let settingsStore: SettingsStoreSnapshot = createDefaultStore();
let hasLoadedPersistedStore = false;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function syncRoleMemberCounts(store: SettingsStoreSnapshot): SettingsStoreSnapshot {
  const counts = new Map<string, number>();
  store.users
    .filter((user) => user.status !== "inactive")
    .forEach((user) => {
      counts.set(user.roleId, (counts.get(user.roleId) || 0) + 1);
    });

  return {
    ...store,
    roles: store.roles.map((role) => ({
      ...role,
      memberCount: counts.get(role.id) || 0,
    })),
  };
}

function persistStore() {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(SETTINGS_STORE_KEY, JSON.stringify(settingsStore));
}

function ensureStoreLoaded() {
  if (hasLoadedPersistedStore || !canUseStorage()) {
    return;
  }

  const raw = window.localStorage.getItem(SETTINGS_STORE_KEY);
  if (!raw) {
    settingsStore = syncRoleMemberCounts(createDefaultStore());
    persistStore();
    hasLoadedPersistedStore = true;
    return;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SettingsStoreSnapshot>;
    settingsStore = syncRoleMemberCounts({
      ...createDefaultStore(),
      ...parsed,
      policies: {
        attendance: {
          ...defaultPolicies.attendance,
          ...parsed.policies?.attendance,
        },
        grades: {
          ...defaultPolicies.grades,
          ...parsed.policies?.grades,
        },
        behavior: {
          ...defaultPolicies.behavior,
          ...parsed.policies?.behavior,
        },
      },
      admissionsDocuments: cloneStore(
        parsed.admissionsDocuments || defaultAdmissionsDocumentRequirements,
      ),
      securitySettings: {
        ...defaultSecuritySettings,
        ...parsed.securitySettings,
      },
      roles: cloneStore(parsed.roles || defaultRoles),
      users: cloneStore(parsed.users || defaultUsers),
      notificationTemplates: cloneStore(
        parsed.notificationTemplates || defaultNotificationTemplates,
      ),
      integrations: cloneStore(parsed.integrations || defaultIntegrations),
      auditLog: cloneStore(parsed.auditLog || defaultAuditLogEntries),
      backupHistory: cloneStore(parsed.backupHistory || defaultBackupHistory),
      currentUser: {
        ...defaultCurrentSettingsUser,
        ...parsed.currentUser,
      },
    });
  } catch {
    settingsStore = syncRoleMemberCounts(createDefaultStore());
    persistStore();
  }

  hasLoadedPersistedStore = true;
}

function getStore(): SettingsStoreSnapshot {
  ensureStoreLoaded();
  return settingsStore;
}

function setStore(updater: (current: SettingsStoreSnapshot) => SettingsStoreSnapshot) {
  settingsStore = syncRoleMemberCounts(updater(getStore()));
  persistStore();
}

function prependAuditEntry(entry: Omit<AuditLogEntry, "id" | "timestamp">) {
  setStore((current) => ({
    ...current,
    auditLog: [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...entry,
      },
      ...current.auditLog,
    ].slice(0, 200),
  }));
}

function getCurrentUserName() {
  return getStore().currentUser.name;
}

function maskSecret(value: string) {
  if (!value) return "";
  if (value.length <= 4) return "*".repeat(value.length);
  return `${"*".repeat(Math.max(value.length - 4, 4))}${value.slice(-4)}`;
}

function cloneIntegration(item: IntegrationProviderStatus): IntegrationProviderStatus {
  return {
    ...item,
    fields: item.fields.map((field) => ({ ...field })),
    configuration: {
      ...item.configuration,
      values: { ...item.configuration.values },
    },
  };
}

function cloneTemplate(item: NotificationTemplateConfig): NotificationTemplateConfig {
  return {
    ...item,
    variables: [...item.variables],
    channelStates: item.channelStates.map((channel) => ({ ...channel })),
    template: {
      ...item.template,
      channels: [...item.template.channels],
    },
  };
}

export async function fetchPolicySettings(): Promise<PolicySettings> {
  await delay();
  return cloneStore(getStore().policies);
}

export async function updatePolicySettings(payload: PolicySettings): Promise<PolicySettings> {
  await delay();
  setStore((current) => ({
    ...current,
    policies: cloneStore(payload),
  }));
  prependAuditEntry({
    actor: getCurrentUserName(),
    action: "Updated school policy configuration",
    module: "Policies",
    entity: "settings-policies",
    severity: "warning",
    ipAddress: "10.0.0.10",
  });
  return fetchPolicySettings();
}

export async function fetchAdmissionRequiredDocumentsForSchool(
  schoolId: string,
): Promise<AdmissionRequiredDocument[]> {
  const encodedSchoolId = encodeURIComponent(schoolId);
  const response = await apiGet<unknown>(
    `/applicant-portal/schools/${encodedSchoolId}/admission-required-documents`,
  );

  return unwrapArrayResponse(response, "admission required documents")
    .map(mapAdmissionRequiredDocument)
    .sort((first, second) => first.sortOrder - second.sortOrder);
}

export async function fetchAdmissionsDocumentRequirements(): Promise<
  AdmissionsRequiredDocumentConfig[]
> {
  await delay();
  return cloneStore(getStore().admissionsDocuments).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

export async function updateAdmissionsDocumentRequirements(
  payload: AdmissionsRequiredDocumentConfig[],
): Promise<AdmissionsRequiredDocumentConfig[]> {
  await delay();
  const normalized = cloneStore(payload)
    .map((item, index) => ({
      ...item,
      id: item.id.trim(),
      nameEn: item.nameEn.trim(),
      nameAr: item.nameAr.trim(),
      sortOrder: index + 1,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  setStore((current) => ({
    ...current,
    admissionsDocuments: normalized,
  }));
  prependAuditEntry({
    actor: getCurrentUserName(),
    action: "Updated admissions document requirements",
    module: "Admissions Documents",
    entity: "settings-admissions-documents",
    severity: "warning",
    ipAddress: "10.0.0.10",
  });
  return fetchAdmissionsDocumentRequirements();
}

export async function fetchNotificationTemplates(): Promise<NotificationTemplateConfig[]> {
  await delay();
  return getStore().notificationTemplates.map(cloneTemplate);
}

export async function updateNotificationTemplate(
  templateId: string,
  payload: NotificationTemplateConfig,
): Promise<NotificationTemplateConfig> {
  await delay();
  const existingTemplate = getStore().notificationTemplates.find(
    (template) => template.id === templateId,
  );
  if (!existingTemplate) {
    throw new Error("template_not_found");
  }
  const updated = cloneTemplate({
    ...existingTemplate,
    ...payload,
  });
  setStore((current) => ({
    ...current,
    notificationTemplates: current.notificationTemplates.map((template) =>
      template.id === templateId ? updated : template,
    ),
  }));

  prependAuditEntry({
    actor: getCurrentUserName(),
    action: `Updated notification template ${updated.name}`,
    module: "Templates",
    entity: updated.id,
    severity: "info",
    ipAddress: "10.0.0.10",
  });
  return cloneTemplate(updated);
}

export async function runTemplateTest(templateId: string): Promise<NotificationTemplateConfig> {
  await delay();
  const template = getStore().notificationTemplates.find((item) => item.id === templateId);
  if (!template) {
    throw new Error("template_not_found");
  }
  return updateNotificationTemplate(templateId, {
    ...template,
    lastTestAt: new Date().toISOString(),
  });
}

export async function fetchIntegrations(): Promise<IntegrationProviderStatus[]> {
  await delay();
  return getStore().integrations.map(cloneIntegration).map((integration) => ({
    ...integration,
    configuration: {
      ...integration.configuration,
      values: Object.fromEntries(
        Object.entries(integration.configuration.values).map(([key, value]) => {
          const field = integration.fields.find((item) => item.key === key);
          return [key, field?.type === "password" ? maskSecret(value) : value];
        }),
      ),
    },
  }));
}

export async function fetchIntegrationById(
  integrationId: string,
): Promise<IntegrationProviderStatus> {
  await delay();
  const integration = getStore().integrations.find((item) => item.id === integrationId);
  if (!integration) {
    throw new Error("integration_not_found");
  }
  return cloneIntegration(integration);
}

export async function updateIntegrationConfiguration(
  integrationId: string,
  values: Record<string, string>,
): Promise<IntegrationProviderStatus> {
  await delay();
  const integration = getStore().integrations.find((item) => item.id === integrationId);
  if (!integration) {
    throw new Error("integration_not_found");
  }
  const updated: IntegrationProviderStatus = {
    ...integration,
    configuration: {
      providerId: integration.id,
      values: { ...values },
      updatedAt: new Date().toISOString(),
    },
    status: "connected",
    lastCheckedAt: new Date().toISOString(),
  };
  setStore((current) => ({
    ...current,
    integrations: current.integrations.map((item) =>
      item.id === integrationId ? updated : item,
    ),
  }));
  prependAuditEntry({
    actor: getCurrentUserName(),
    action: `Updated integration ${updated.provider}`,
    module: "Integrations",
    entity: updated.id,
    severity: "warning",
    ipAddress: "10.0.0.10",
  });
  return fetchIntegrationById(integrationId);
}

export async function testIntegrationConnection(
  integrationId: string,
): Promise<IntegrationProviderStatus> {
  await delay();
  const integration = getStore().integrations.find((item) => item.id === integrationId);
  if (!integration) {
    throw new Error("integration_not_found");
  }
  const updated: IntegrationProviderStatus = {
    ...integration,
    lastCheckedAt: new Date().toISOString(),
    lastTestAt: new Date().toISOString(),
    status:
      Object.keys(integration.configuration.values).length > 0
        ? "connected"
        : "needs_attention",
    healthNote:
      Object.keys(integration.configuration.values).length > 0
        ? "Connection test succeeded."
        : "Configuration is incomplete.",
  };
  setStore((current) => ({
    ...current,
    integrations: current.integrations.map((item) =>
      item.id === integrationId ? updated : item,
    ),
  }));
  prependAuditEntry({
    actor: getCurrentUserName(),
    action: `Ran connectivity test for ${updated.provider}`,
    module: "Integrations",
    entity: updated.id,
    severity: updated.status === "connected" ? "info" : "warning",
    ipAddress: "10.0.0.10",
  });
  return fetchIntegrationById(integrationId);
}

export async function fetchAuditLogEntries(): Promise<AuditLogEntry[]> {
  await delay();
  return cloneStore(getStore().auditLog);
}

export async function fetchBackupHistory(): Promise<BackupHistoryEntry[]> {
  await delay();
  return cloneStore(getStore().backupHistory);
}

export async function createBackupJob(payload: {
  type: BackupHistoryEntry["type"];
  note?: string;
}): Promise<BackupHistoryEntry> {
  await delay();
  const entry: BackupHistoryEntry = {
    id: `backup-${Date.now()}`,
    type: payload.type,
    status: "completed",
    fileName: `${payload.type}-${new Date().toISOString().slice(0, 10)}.json`,
    createdAt: new Date().toISOString(),
    createdBy: getCurrentUserName(),
    note: payload.note,
  };
  setStore((current) => ({
    ...current,
    backupHistory: [entry, ...current.backupHistory],
  }));
  prependAuditEntry({
    actor: getCurrentUserName(),
    action: `Created ${payload.type} job`,
    module: "Backup",
    entity: entry.id,
    severity: "warning",
    ipAddress: "10.0.0.10",
  });
  return cloneStore(entry);
}

export async function importSettingsSnapshot(note?: string): Promise<BackupHistoryEntry> {
  return createBackupJob({ type: "import", note: note || "Imported settings snapshot" });
}

export async function exportSettingsSnapshot(note?: string): Promise<BackupHistoryEntry> {
  return createBackupJob({ type: "export", note: note || "Exported settings snapshot" });
}
