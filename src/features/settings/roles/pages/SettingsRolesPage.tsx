"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Check,
  ChevronDown,
  ChevronRight,
  CopyPlus,
  Download,
  Trash2,
  Minus,
  Plus,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import Button from "@/components/ui/button/Button";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import RoleEditorModal from "@/features/settings/components/RoleEditorModal";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import SettingsGlobalExportModal from "@/features/settings/shared/components/export/SettingsGlobalExportModal";
import {
  exportSettingsData,
  formatSettingsExportDate,
  type ExportColumn,
  type SettingsExportFormat,
} from "@/features/settings/shared/utils/settingsExport";
import {
  cloneSettingsRole,
  createSettingsRole,
  deleteSettingsRole,
  type FetchSettingsRolesParams,
  fetchSettingsPermissions,
  fetchSettingsRoles,
  replaceSettingsRolePermissions,
} from "@/features/settings/services/settingsRolesService";
import type {
  PermissionAction,
  PermissionDefinition,
  RoleDefinition,
} from "@/features/settings/types";
import { usePermissions } from "@/hooks/usePermissions";
import { isApiError } from "@/lib/api-error";
import { getValidationFieldErrors } from "@/lib/validation-errors";
import {
  assertRolePermissionsResponseMatchesRole,
  mergeRolePermissions,
} from "@/features/settings/roles/utils/mergeRolePermissions";

type PermissionCatalogState = "loading" | "ready" | "forbidden" | "failed";

type PermissionMatrixRow = {
  id: string;
  label: string;
  cells: Partial<Record<string, PermissionDefinition>>;
};

const isPermissionActionSupported = (
  rows: PermissionMatrixRow[],
  action: string,
) => rows.some((row) => Boolean(row.cells[action]));

export default function SettingsRolesPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const t = useTranslations("settings.roles");
  const tExport = useTranslations("settings.export");
  const tCommon = useTranslations("common");
  const { hasPermission } = usePermissions();
  const { showSuccess, showError } = useToast();
  const canManageRoles = hasPermission("settings.roles.manage");
  const canViewPermissionCatalog = hasPermission("settings.permissions.view");
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [permissions, setPermissions] = useState<PermissionDefinition[]>([]);
  const [permissionCatalogState, setPermissionCatalogState] =
    useState<PermissionCatalogState>(
      canViewPermissionCatalog ? "loading" : "forbidden",
    );
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [modalMode, setModalMode] = useState<"create" | "clone" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const hasLoadedRolesRef = useRef(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRoles, setTotalRoles] = useState(0);
  const [modalFieldErrors, setModalFieldErrors] = useState<
    Partial<Record<"name" | "description", string>>
  >({});
  const [modalError, setModalError] = useState<string | null>(null);
  const [isDeletingRole, setIsDeletingRole] = useState(false);
  const [expandedModules, setExpandedModules] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoading(!hasLoadedRolesRef.current);
      setIsTableLoading(true);
      try {
        const rolesParams: FetchSettingsRolesParams = {
          page,
          limit,
        };
        const rolesResult = await fetchSettingsRoles(rolesParams);

        if (isCancelled) {
          return;
        }

        setRoles(rolesResult.items);
        setPage(rolesResult.pagination.page);
        setLimit(rolesResult.pagination.limit);
        setTotalRoles(rolesResult.pagination.total);
        hasLoadedRolesRef.current = true;
        setSelectedRoleId(
          (current) => current || rolesResult.items[0]?.id || "",
        );
      } catch {
        if (!isCancelled) {
          showError(t("messages.load_failed"));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          setIsTableLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [limit, page, showError, t]);

  useEffect(() => {
    if (!canViewPermissionCatalog) {
      setPermissions([]);
      setPermissionCatalogState("forbidden");
      return;
    }

    let isCancelled = false;
    setPermissionCatalogState("loading");

    void fetchSettingsPermissions()
      .then((nextPermissions) => {
        if (!isCancelled) {
          setPermissions(nextPermissions);
          setPermissionCatalogState("ready");
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setPermissions([]);
          setPermissionCatalogState("failed");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [canViewPermissionCatalog]);

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

  const actionColumns = useMemo(() => {
    const knownOrder: PermissionAction[] = [
      "view",
      "manage",
      "configure",
      "export",
    ];
    const present = new Set(permissions.map((permission) => permission.action));
    const ordered = knownOrder.filter((action) => present.has(action));
    const remaining = Array.from(present).filter(
      (action) => !knownOrder.includes(action),
    );
    return [...ordered, ...remaining];
  }, [permissions]);

  const permissionMatrix = useMemo(() => {
    return groupedPermissions.map(([module, modulePermissions]) => {
      const rowMap = new Map<string, PermissionMatrixRow>();

      modulePermissions.forEach((permission) => {
        const keyParts = permission.key.split(".");
        const resourceKey = keyParts.slice(1, -1).join(".") || permission.key;
        const resourceLabel =
          resourceKey
            .split(".")
            .map((part) => part.replace(/_/g, " "))
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ") || permission.label;

        const existing = rowMap.get(resourceKey) || {
          id: resourceKey,
          label: resourceLabel,
          cells: {},
        };
        existing.cells[permission.action] = permission;
        rowMap.set(resourceKey, existing);
      });

      return {
        module,
        rows: Array.from(rowMap.values()).sort((a, b) =>
          a.label.localeCompare(b.label),
        ),
      };
    });
  }, [groupedPermissions]);

  useEffect(() => {
    setExpandedModules((current) => {
      const next = { ...current };
      permissionMatrix.forEach(({ module }) => {
        if (typeof next[module] === "undefined") {
          next[module] = false;
        }
      });
      return next;
    });
  }, [permissionMatrix]);

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
          ? await cloneSettingsRole(selectedRole.id, payload.name)
          : await createSettingsRole(payload);
      setRoles((current) => [nextRole, ...current]);
      setSelectedRoleId(nextRole.id);
      setModalMode(null);
      setModalFieldErrors({});
      setModalError(null);
      showSuccess(
        modalMode === "clone"
          ? t("messages.role_cloned")
          : t("messages.role_created"),
      );
    } catch (error) {
      const fieldErrors = getValidationFieldErrors(error);
      if (isApiError(error) && error.code === "validation.failed") {
        setModalFieldErrors({
          name: fieldErrors.name,
          description: fieldErrors.description,
        });
        setModalError(tCommon("validation_failed"));
        return;
      }
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
      const updatedRole = await replaceSettingsRolePermissions(
        selectedRole.id,
        selectedRole.permissions,
      );
      assertRolePermissionsResponseMatchesRole(selectedRole.id, updatedRole);
      setRoles((current) => mergeRolePermissions(current, updatedRole));
      showSuccess(t("messages.permissions_saved"));
    } catch {
      showError(tCommon("save_failed"));
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const refreshRoles = async (nextPage?: number) => {
    const rolesParams: FetchSettingsRolesParams = {
      page: nextPage ?? page,
      limit,
    };
    const result = await fetchSettingsRoles(rolesParams);
    setRoles(result.items);
    setPage(result.pagination.page);
    setLimit(result.pagination.limit);
    setTotalRoles(result.pagination.total);
    setSelectedRoleId((current) => {
      if (result.items.some((role) => role.id === current)) {
        return current;
      }
      return result.items[0]?.id || "";
    });
  };

  const handleDeleteSelectedRole = async () => {
    if (!selectedRole || selectedRole.isSystem) {
      return;
    }
    setIsDeletingRole(true);
    try {
      await deleteSettingsRole(selectedRole.id);

      const remainingAfterDelete = Math.max(totalRoles - 1, 0);
      const maxPageAfterDelete = Math.max(
        1,
        Math.ceil(remainingAfterDelete / Math.max(limit, 1)),
      );
      await refreshRoles(Math.min(page, maxPageAfterDelete));
      showSuccess(t("messages.role_deleted"));
    } catch {
      showError(tCommon("delete_failed"));
    } finally {
      setIsDeletingRole(false);
    }
  };

  const handleDeleteRole = async (role: RoleDefinition) => {
    if (role.isSystem) {
      return;
    }
    setIsDeletingRole(true);
    try {
      await deleteSettingsRole(role.id);

      const remainingAfterDelete = Math.max(totalRoles - 1, 0);
      const maxPageAfterDelete = Math.max(
        1,
        Math.ceil(remainingAfterDelete / Math.max(limit, 1)),
      );
      await refreshRoles(Math.min(page, maxPageAfterDelete));
      showSuccess(t("messages.role_deleted"));
    } catch {
      showError(tCommon("delete_failed"));
    } finally {
      setIsDeletingRole(false);
    }
  };

  const isPermissionChecked = (permissionKey: string) => {
    return selectedRole?.permissions.includes(permissionKey) ?? false;
  };

  const toggleModuleAction = (
    moduleRows: PermissionMatrixRow[],
    action: string,
  ) => {
    if (!selectedRole) {
      return;
    }

    const keys = moduleRows
      .map((row) => row.cells[action]?.key)
      .filter((value): value is string => Boolean(value));
    if (keys.length === 0) {
      return;
    }

    const allChecked = keys.every((key) =>
      selectedRole.permissions.includes(key),
    );

    setRoles((current) =>
      current.map((role) => {
        if (role.id !== selectedRole.id) {
          return role;
        }

        const currentSet = new Set(role.permissions);
        if (allChecked) {
          keys.forEach((key) => currentSet.delete(key));
        } else {
          keys.forEach((key) => currentSet.add(key));
        }

        return {
          ...role,
          permissions: Array.from(currentSet),
        };
      }),
    );
  };

  const getModuleActionState = (
    moduleRows: PermissionMatrixRow[],
    action: string,
  ) => {
    if (!selectedRole) {
      return "none";
    }
    const keys = moduleRows
      .map((row) => row.cells[action]?.key)
      .filter((value): value is string => Boolean(value));
    if (keys.length === 0) {
      return "none";
    }

    const checkedCount = keys.filter((key) =>
      selectedRole.permissions.includes(key),
    ).length;
    if (checkedCount === 0) {
      return "none";
    }
    if (checkedCount === keys.length) {
      return "all";
    }
    return "partial";
  };

  const getPermissionCounts = (rows: PermissionMatrixRow[]) => {
    const rowPermissions = rows.flatMap((row) =>
      Object.values(row.cells).filter(
        (permission): permission is PermissionDefinition => Boolean(permission),
      ),
    );
    const uniquePermissions = Array.from(
      new Map(
        rowPermissions.map((permission) => [permission.key, permission]),
      ).values(),
    );

    return {
      selected: uniquePermissions.filter((permission) =>
        isPermissionChecked(permission.key),
      ).length,
      total: uniquePermissions.length,
    };
  };

  const renderUnavailablePermission = (module: string) => {
    const label = isArabic
      ? `هذا الإذن غير مدعوم من وحدة ${module}`
      : `This permission is not supported by the ${module} module.`;

    return (
      <span
        role="img"
        aria-label={label}
        title={label}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400"
      >
        —
      </span>
    );
  };

  const renderMatrixToggle = (
    state: "none" | "partial" | "all",
    onClick: () => void,
    disabled: boolean,
  ) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={`permission-${state}`}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition-[background-color,border-color,color,opacity,box-shadow] duration-150 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
        state === "none"
          ? "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"
          : "border-blue-600 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700"
      } ${disabled ? "cursor-not-allowed opacity-50 hover:border-inherit hover:bg-inherit" : "cursor-pointer"}`}
    >
      {state === "all" ? (
        <Check className="h-3.5 w-3.5" />
      ) : state === "partial" ? (
        <Minus className="h-3.5 w-3.5" />
      ) : null}
    </button>
  );

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
        <span className="text-sm text-gray-700">
          {value
            ? locale === "ar"
              ? "نظام"
              : "System"
            : locale === "ar"
              ? "مخصص"
              : "Custom"}
        </span>
      ),
    },
    {
      key: "id",
      label: t("table.actions"),
      sortable: false,
      render: (_value: unknown, row: Record<string, unknown>) => {
        const role = row as unknown as RoleDefinition;
        return canManageRoles ? (
          <div className="flex gap-2">
            {!role.isSystem ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 rounded-lg border border-gray-200 p-0"
                title={t("delete")}
                aria-label={t("delete")}
                loading={isDeletingRole}
                disabled={isDeletingRole}
                onClick={(event) => {
                  event.stopPropagation();
                  void handleDeleteRole(role);
                }}
              >
                <Trash2 className="h-4 w-4 text-error" />
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
            canManageRoles ? (
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
                  loading={isDeletingRole}
                  disabled={
                    !selectedRole || selectedRole.isSystem || isDeletingRole
                  }
                  onClick={() => void handleDeleteSelectedRole()}
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
              permissionCatalogState === "ready" ? (
                <Button
                  variant="primary"
                  loading={isSavingPermissions}
                  disabled={
                    !selectedRole || !canManageRoles || selectedRole.isSystem
                  }
                  onClick={handleSavePermissions}
                >
                  {isSavingPermissions
                    ? tCommon("saving")
                    : t("save_permissions")}
                </Button>
              ) : null
            }
          >
            {permissionCatalogState === "forbidden" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
                {t("permission_matrix_access_required")}
              </div>
            ) : permissionCatalogState === "failed" ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                {t("permission_matrix_load_failed")}
              </div>
            ) : permissionCatalogState === "loading" ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                {t("permission_matrix_loading")}
              </div>
            ) : selectedRole ? (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-[760px] w-full text-sm">
                  <thead className="bg-gray-50/90">
                    <tr>
                      <th
                        className={`sticky top-0 z-30 bg-gray-50/95 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600 backdrop-blur-sm shadow-[0_2px_6px_-4px_rgba(15,23,42,0.35)] ${isArabic ? "right-0 text-right shadow-[-2px_0_6px_-4px_rgba(15,23,42,0.35)]" : "left-0 text-left shadow-[2px_0_6px_-4px_rgba(15,23,42,0.35)]"}`}
                      >
                        {t("permission_matrix_title")}
                      </th>
                      {actionColumns.map((action) => (
                        <th
                          key={action}
                          className="sticky top-0 z-20 bg-gray-50/95 px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-600 shadow-[0_2px_6px_-4px_rgba(15,23,42,0.35)] backdrop-blur-sm"
                        >
                          {action}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {permissionMatrix.map(({ module, rows }) => {
                      const isExpanded = expandedModules[module] ?? true;
                      const moduleId = `permission-module-${module.replace(/[^a-zA-Z0-9]+/g, "-")}`;
                      const moduleCounts = getPermissionCounts(rows);
                      return (
                        <Fragment key={`${module}-module`}>
                          <tr
                            id={moduleId}
                            className="bg-gray-50/70 transition-colors duration-150 hover:bg-gray-100/80 motion-reduce:transition-none"
                          >
                            <td
                              className={`sticky z-10 bg-gray-50/95 px-3 py-2.5 backdrop-blur-sm ${isArabic ? "right-0 text-right shadow-[-2px_0_6px_-4px_rgba(15,23,42,0.35)]" : "left-0 text-left shadow-[2px_0_6px_-4px_rgba(15,23,42,0.35)]"}`}
                            >
                              <button
                                type="button"
                                aria-label={module}
                                aria-expanded={isExpanded}
                                aria-controls={`${moduleId}-rows`}
                                className="inline-flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-semibold text-gray-900 transition-colors duration-150 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 motion-reduce:transition-none"
                                onClick={() =>
                                  setExpandedModules((current) => ({
                                    ...current,
                                    [module]: !isExpanded,
                                  }))
                                }
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-500" />
                                )}
                                <span>{module}</span>
                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium tabular-nums text-blue-700">
                                  {moduleCounts.selected} / {moduleCounts.total}
                                </span>
                              </button>
                            </td>
                            {actionColumns.map((action) => {
                              const supported = isPermissionActionSupported(
                                rows,
                                action,
                              );
                              return (
                                <td
                                  key={`${module}-${action}`}
                                  className="px-4 py-3 text-center"
                                >
                                  {supported
                                    ? renderMatrixToggle(
                                        getModuleActionState(rows, action),
                                        () => toggleModuleAction(rows, action),
                                        !canManageRoles ||
                                          Boolean(selectedRole?.isSystem),
                                      )
                                    : renderUnavailablePermission(module)}
                                </td>
                              );
                            })}
                          </tr>
                          {isExpanded
                            ? rows.map((row, rowIndex) => {
                                const rowCounts = getPermissionCounts([row]);
                                return (
                                  <tr
                                    key={`${module}-${row.id}`}
                                    id={
                                      rowIndex === 0
                                        ? `${moduleId}-rows`
                                        : undefined
                                    }
                                    className="bg-hover-50"
                                  >
                                    <td
                                      className={`px-5 py-2.5 text-sm text-gray-800 transition-colors duration-150 hover:bg-gray-50 motion-reduce:transition-none ${isArabic ? "border-r-2 border-blue-100 pr-10 text-right" : "border-l-2 border-blue-100 pl-10 text-left"}`}
                                    >
                                      <div className="flex items-center justify-between gap-3">
                                        <span>{row.label}</span>
                                        <span className="shrink-0 text-[11px] tabular-nums text-gray-500">
                                          {rowCounts.selected} /{" "}
                                          {rowCounts.total}
                                        </span>
                                      </div>
                                    </td>
                                    {actionColumns.map((action) => {
                                      const permission = row.cells[action];
                                      const checked = permission
                                        ? isPermissionChecked(permission.key)
                                        : false;
                                      return (
                                        <td
                                          key={`${module}-${row.id}-${action}`}
                                          className="px-3 py-2.5 text-center transition-colors duration-150 hover:bg-gray-50 motion-reduce:transition-none"
                                        >
                                          {permission
                                            ? renderMatrixToggle(
                                                checked ? "all" : "none",
                                                () =>
                                                  handleTogglePermission(
                                                    permission.key,
                                                  ),
                                                !canManageRoles ||
                                                  Boolean(
                                                    selectedRole?.isSystem,
                                                  ),
                                              )
                                            : renderUnavailablePermission(
                                                module,
                                              )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })
                            : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
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
              isLoading={isTableLoading}
              showPagination
              itemsPerPage={limit}
              serverPagination={{
                enabled: true,
                currentPage: page,
                pageSize: limit,
                totalItems: totalRoles,
                onPageChange: (nextPage) => setPage(nextPage),
                onPageSizeChange: (nextSize) => {
                  setLimit(nextSize);
                  setPage(1);
                },
              }}
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
          errors={modalFieldErrors}
          formError={modalError}
          onFieldChange={(field) =>
            setModalFieldErrors((current) => ({
              ...current,
              [field]: undefined,
            }))
          }
          onClose={() => {
            setModalMode(null);
            setModalFieldErrors({});
            setModalError(null);
          }}
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
