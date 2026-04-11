"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CopyPlus, Download, Pencil, Plus, Trash, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import Button from "@/components/ui/button/Button";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import RoleEditorModal from "@/features/settings/components/RoleEditorModal";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import SettingsStatusBadge from "@/features/settings/components/SettingsStatusBadge";
import SettingsGlobalExportModal from "@/features/settings/shared/components/export/SettingsGlobalExportModal";
import {
  exportSettingsData,
  formatSettingsExportDate,
  type ExportColumn,
  type SettingsExportFormat,
} from "@/features/settings/shared/utils/settingsExport";
import {
  cloneRole,
  createRole,
  deleteRole,
  fetchPermissionCatalog,
  fetchRoles,
  updateRole,
  updateRolePermissions,
} from "@/features/settings/services/settingsService";
import type {
  PermissionDefinition,
  RoleDefinition,
} from "@/features/settings/types";
import { usePermissions } from "@/hooks/usePermissions";

export default function SettingsRolesPage() {
  const locale = useLocale();
  const t = useTranslations("settings.roles");
  const tExport = useTranslations("settings.export");
  const tCommon = useTranslations("common");
  const { hasPermission } = usePermissions();
  const { showSuccess, showError } = useToast();
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [permissions, setPermissions] = useState<PermissionDefinition[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [modalMode, setModalMode] = useState<
    "create" | "clone" | "edit" | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      try {
        const [nextRoles, nextPermissions] = await Promise.all([
          fetchRoles(),
          fetchPermissionCatalog(),
        ]);

        if (isCancelled) {
          return;
        }

        setRoles(nextRoles);
        setPermissions(nextPermissions);
        setSelectedRoleId((current) => current || nextRoles[0]?.id || "");
      } catch {
        if (!isCancelled) {
          showError(t("messages.load_failed"));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [showError, t]);

  const selectedRole =
    roles.find((role) => role.id === selectedRoleId) || roles[0] || null;

  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, PermissionDefinition[]>();

    permissions.forEach((permission) => {
      const existing = groups.get(permission.module) || [];
      existing.push(permission);
      groups.set(permission.module, existing);
    });

    return Array.from(groups.entries());
  }, [permissions]);

  const handleExport = (format: SettingsExportFormat) => {
    const metadata = {
      viewName: t("title"),
      exportDate: formatSettingsExportDate(locale),
      visibleCount: roles.length,
    };
    const columns: ExportColumn[] = [
      { key: "id", label: "ID" },
      { key: "name", label: t("table.role") },
      { key: "description", label: locale === "ar" ? "الوصف" : "Description" },
      { key: "type", label: t("table.type") },
      { key: "memberCount", label: t("table.members") },
      { key: "permissionCount", label: t("table.permissions") },
      {
        key: "permissionsSummary",
        label: locale === "ar" ? "ملخص الصلاحيات" : "Permissions summary",
      },
    ];
    const rows = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      type: role.isSystem
        ? locale === "ar"
          ? "نظام"
          : "System"
        : locale === "ar"
          ? "مخصص"
          : "Custom",
      memberCount: role.memberCount,
      permissionCount: role.permissions.length,
      permissionsSummary: role.permissions.join(", "),
    }));

    exportSettingsData({
      title: t("title"),
      metadata,
      filename: "settings-roles",
      format,
      columns,
      rows,
      locale,
      emptyMessage: tExport("errors.noData"),
      jsonData: {
        title: "Settings Roles",
        metadata,
        roles,
      },
    });
  };

  const handleCreateOrClone = async (payload: {
    name: string;
    description: string;
  }) => {
    try {
      const nextRole =
        modalMode === "clone" && selectedRole
          ? await cloneRole(selectedRole.id, payload.name)
          : modalMode === "edit" && selectedRole
            ? await updateRole(selectedRole.id, payload)
            : await createRole(payload);
      setRoles((current) =>
        modalMode === "edit"
          ? current.map((role) => (role.id === nextRole.id ? nextRole : role))
          : [nextRole, ...current],
      );
      setSelectedRoleId(nextRole.id);
      setModalMode(null);
      showSuccess(
        modalMode === "clone"
          ? t("messages.role_cloned")
          : modalMode === "edit"
            ? t("messages.role_updated")
            : t("messages.role_created"),
      );
    } catch {
      showError(tCommon("save_failed"));
    }
  };

  const handleTogglePermission = (permissionKey: string) => {
    if (!selectedRole) {
      return;
    }

    setRoles((current) =>
      current.map((role) =>
        role.id !== selectedRole.id
          ? role
          : {
              ...role,
              permissions: role.permissions.includes(permissionKey)
                ? role.permissions.filter((key) => key !== permissionKey)
                : [...role.permissions, permissionKey],
            },
      ),
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) {
      return;
    }

    setIsSavingPermissions(true);
    try {
      const updatedRole = await updateRolePermissions(
        selectedRole.id,
        selectedRole.permissions,
      );
      setRoles((current) =>
        current.map((role) =>
          role.id === updatedRole.id ? updatedRole : role,
        ),
      );
      showSuccess(t("messages.permissions_saved"));
    } catch {
      showError(tCommon("save_failed"));
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleDeleteRole = async (
    role: RoleDefinition | null = selectedRole,
  ) => {
    if (!role) {
      return;
    }
    try {
      await deleteRole(role.id);
      const nextRoles = roles.filter((item) => item.id !== role.id);
      setRoles(nextRoles);
      setSelectedRoleId(nextRoles[0]?.id || "");
      showSuccess(t("messages.role_deleted"));
    } catch (error) {
      showError(
        error instanceof Error && error.message === "role_in_use"
          ? t("messages.role_in_use")
          : tCommon("delete_failed"),
      );
    }
  };

  const columns = [
    {
      key: "name",
      label: t("table.role"),
      searchable: true,
      render: (value: unknown, row: Record<string, unknown>) => {
        const role = row as unknown as RoleDefinition;
        return (
          <div>
            <p className="font-semibold text-gray-900">{String(value)}</p>
            <p className="mt-1 text-xs text-gray-500">{role.description}</p>
          </div>
        );
      },
    },
    {
      key: "memberCount",
      label: t("table.members"),
    },
    {
      key: "permissions",
      label: t("table.permissions"),
      render: (value: unknown) => (
        <span className="text-sm text-gray-600">
          {(value as string[]).length}
        </span>
      ),
    },
    {
      key: "isSystem",
      label: t("table.type"),
      render: (value: unknown) => (
        <SettingsStatusBadge
          status={(value ? "active" : "draft") as "active" | "draft"}
        />
      ),
    },
    {
      key: "id",
      label: t("table.actions"),
      sortable: false,
      render: (_value: unknown, row: Record<string, unknown>) => {
        const role = row as unknown as RoleDefinition;
        return hasPermission("settings.roles.manage") ? (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 rounded-lg border border-gray-200 p-0"
              title={t("edit")}
              aria-label={t("edit")}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedRoleId(role.id);
                setModalMode("edit");
              }}
            >
              <Pencil className="h-4 w-4 text-info" />
            </Button>
            {!role.isSystem ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 rounded-lg border border-gray-200 p-0"
                title={t("delete")}
                aria-label={t("delete")}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedRoleId(role.id);
                  void handleDeleteRole(role);
                }}
              >
                <Trash className="h-4 w-4 text-error" />
              </Button>
            ) : null}
          </div>
        ) : null;
      },
    },
  ];

  if (isLoading) {
    return <MainLoader />;
  }

  return (
    <SettingsAccessGuard permission="settings.roles.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
        <SettingsPageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            hasPermission("settings.roles.manage") ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  leftIcon={<Download className="h-4 w-4" />}
                  onClick={() => setIsExportModalOpen(true)}
                >
                  {tExport("button")}
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<Pencil className="h-4 w-4" />}
                  disabled={!selectedRole}
                  onClick={() => setModalMode("edit")}
                >
                  {t("edit_role")}
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<CopyPlus className="h-4 w-4" />}
                  disabled={!selectedRole}
                  onClick={() => setModalMode("clone")}
                >
                  {t("clone_role")}
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setModalMode("create")}
                >
                  {t("create_role")}
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  disabled={!selectedRole || selectedRole.isSystem}
                  onClick={() => void handleDeleteRole()}
                >
                  {t("delete_role")}
                </Button>
              </div>
            ) : null
          }
        />

        <div className="flex flex-col gap-6">
          <SettingsSectionCard
            title={t("permission_matrix_title")}
            description={
              selectedRole
                ? t("permission_matrix_description", {
                    role: selectedRole.name,
                  })
                : t("permission_matrix_empty")
            }
            actions={
              <Button
                variant="primary"
                loading={isSavingPermissions}
                disabled={
                  !selectedRole || !hasPermission("settings.roles.manage")
                }
                onClick={handleSavePermissions}
              >
                {isSavingPermissions
                  ? tCommon("saving")
                  : t("save_permissions")}
              </Button>
            }
          >
            {selectedRole ? (
              <div className="space-y-5 grid sm:grid-cols-1 md:grid-cols-3 xl:grid-cols-4  gap-4">
                {groupedPermissions.map(([module, modulePermissions]) => (
                  <div
                    key={module}
                    className="rounded-xl border border-gray-100"
                  >
                    <div className="border-b border-gray-100 px-4 py-3">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {module}
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {modulePermissions.map((permission) => {
                        const isChecked = selectedRole.permissions.includes(
                          permission.key,
                        );
                        return (
                          <label
                            key={permission.key}
                            className="flex cursor-pointer items-start gap-3 px-4 py-3"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={!hasPermission("settings.roles.manage")}
                              onChange={() =>
                                handleTogglePermission(permission.key)
                              }
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {permission.label}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {permission.description}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                {t("permission_matrix_empty")}
              </div>
            )}
          </SettingsSectionCard>
          <SettingsSectionCard
            title={t("role_list_title")}
            description={t("role_list_description")}
          >
            <DataTable
              columns={columns}
              data={roles as unknown as Record<string, unknown>[]}
              showPagination
              itemsPerPage={10}
              onRowClick={(row) =>
                setSelectedRoleId((row as unknown as RoleDefinition).id)
              }
            />
          </SettingsSectionCard>
        </div>

        <RoleEditorModal
          isOpen={modalMode !== null}
          mode={modalMode || "create"}
          sourceRoleName={selectedRole?.name}
          initialValues={
            modalMode === "edit" && selectedRole
              ? {
                  name: selectedRole.name,
                  description: selectedRole.description,
                }
              : null
          }
          onClose={() => setModalMode(null)}
          onSubmit={handleCreateOrClone}
        />
        <SettingsGlobalExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExport}
          datasetCount={roles.length}
          emptyStateMessage={tExport("errors.noData")}
        />
      </main>
    </SettingsAccessGuard>
  );
}
