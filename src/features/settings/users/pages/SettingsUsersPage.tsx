"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Download,
  KeyRound,
  Mail,
  MailPlus,
  Pencil,
  RefreshCcw,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import { DataTable, FilterPanel } from "@/components/ui";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import SettingsStatusBadge from "@/features/settings/components/SettingsStatusBadge";
import UserEditorModal from "@/features/settings/components/UserEditorModal";
import SettingsGlobalExportModal from "@/features/settings/shared/components/export/SettingsGlobalExportModal";
import {
  exportSettingsData,
  formatSettingsExportDate,
  type ExportColumn,
  type SettingsExportFormat,
} from "@/features/settings/shared/utils/settingsExport";
import {
  createUser,
  fetchRoles,
  fetchUsers,
  inviteUser,
  resendUserInvite,
  setUserStatus,
  triggerUserPasswordReset,
  updateUser,
} from "@/features/settings/services/settingsService";
import type {
  RoleDefinition,
  SettingsUserRecord,
} from "@/features/settings/types";
import { useUrlQueryState } from "@/features/students-guardians/shared/hooks/useUrlQueryState";
import { usePermissions } from "@/hooks/usePermissions";

export default function SettingsUsersPage() {
  const locale = useLocale();
  const t = useTranslations("settings.users");
  const tExport = useTranslations("settings.export");
  const tCommon = useTranslations("common");
  const { hasPermission } = usePermissions();
  const { showSuccess, showError, showInfo } = useToast();
  const [users, setUsers] = useState<SettingsUserRecord[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [modalMode, setModalMode] = useState<
    "create" | "invite" | "edit" | null
  >(null);
  const [selectedUser, setSelectedUser] = useState<SettingsUserRecord | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { values, setValue, replaceValues, reset } = useUrlQueryState<{
    search: string;
    role: string;
    status: string;
  }>({
    defaults: {
      search: "",
      role: "all",
      status: "all",
    },
    debouncedKeys: ["search"],
    modeByKey: {
      search: "replace",
    },
    normalize: (current) => {
      const nextUpdates: Partial<Record<keyof typeof current, string | null>> =
        {};
      const validStatuses = ["all", "active", "invited", "inactive"];

      if (!validStatuses.includes(current.status)) {
        nextUpdates.status = null;
      }

      return Object.keys(nextUpdates).length > 0 ? nextUpdates : null;
    },
  });

  const search = values.search;
  const roleFilter = values.role;
  const statusFilter = values.status;

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      setIsLoading(true);
      try {
        const [nextUsers, nextRoles] = await Promise.all([
          fetchUsers(),
          fetchRoles(),
        ]);
        if (cancelled) {
          return;
        }
        setUsers(nextUsers);
        setRoles(nextRoles);
      } catch {
        if (!cancelled) {
          showError(t("messages.load_failed"));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [showError, t]);

  const rolesMap = useMemo(
    () => new Map(roles.map((role) => [role.id, role.name])),
    [roles],
  );

  useEffect(() => {
    if (roleFilter !== "all" && !roles.some((role) => role.id === roleFilter)) {
      replaceValues({ role: null });
    }
  }, [replaceValues, roleFilter, roles]);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesSearch =
          !search.trim() ||
          user.fullName.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === "all" || user.roleId === roleFilter;
        const matchesStatus =
          statusFilter === "all" || user.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
      }),
    [roleFilter, search, statusFilter, users],
  );

  const hasActiveFilters =
    search.trim() !== "" || roleFilter !== "all" || statusFilter !== "all";

  const handleExport = (format: SettingsExportFormat) => {
    const metadata = {
      viewName: t("title"),
      exportDate: formatSettingsExportDate(locale),
      visibleCount: filteredUsers.length,
    };
    const columns: ExportColumn[] = [
      { key: "id", label: "ID" },
      { key: "fullName", label: t("table.name") },
      { key: "email", label: t("table.email") },
      { key: "role", label: t("table.role") },
      { key: "status", label: t("table.status") },
      { key: "lastActiveAt", label: t("table.last_active") },
      { key: "invitedAt", label: locale === "ar" ? "تاريخ الدعوة" : "Invited at" },
      {
        key: "lastInviteSentAt",
        label: locale === "ar" ? "آخر إعادة إرسال" : "Last invite sent",
      },
    ];
    const rows = filteredUsers.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: rolesMap.get(user.roleId) || user.roleId,
      status: t(`statuses.${user.status}`),
      lastActiveAt: user.lastActiveAt
        ? new Date(user.lastActiveAt).toLocaleString()
        : t("not_available"),
      invitedAt: user.invitedAt ? new Date(user.invitedAt).toLocaleString() : "",
      lastInviteSentAt: user.lastInviteSentAt
        ? new Date(user.lastInviteSentAt).toLocaleString()
        : "",
    }));

    exportSettingsData({
      title: t("title"),
      metadata,
      filename: "settings-users",
      format,
      columns,
      rows,
      locale,
      emptyMessage: tExport("errors.noData"),
      jsonData: {
        title: "Settings Users",
        metadata,
        filters: {
          search,
          role: roleFilter,
          status: statusFilter,
        },
        users: filteredUsers.map((user) => ({
          ...user,
          roleName: rolesMap.get(user.roleId) || user.roleId,
        })),
      },
    });
  };

  useEffect(() => {
    if (hasActiveFilters && !showFilters) {
      setShowFilters(true);
    }
  }, [hasActiveFilters, showFilters]);

  const refresh = async () => {
    const nextUsers = await fetchUsers();
    setUsers(nextUsers);
  };

  const handleModalSubmit = async (payload: {
    fullName: string;
    email: string;
    roleId: string;
  }) => {
    try {
      if (modalMode === "invite") {
        await inviteUser(payload);
        showSuccess(t("messages.invited"));
      } else if (modalMode === "create") {
        await createUser(payload);
        showSuccess(t("messages.created"));
      } else if (modalMode === "edit" && selectedUser) {
        await updateUser(selectedUser.id, payload);
        showSuccess(t("messages.updated"));
      }
      await refresh();
      setModalMode(null);
      setSelectedUser(null);
    } catch {
      showError(tCommon("save_failed"));
    }
  };

  const handleResendInvite = async (userId: string) => {
    try {
      await resendUserInvite(userId);
      await refresh();
      showSuccess(t("messages.invite_resent"));
    } catch {
      showError(tCommon("save_failed"));
    }
  };

  const handlePasswordReset = async (userId: string) => {
    try {
      await triggerUserPasswordReset(userId);
      showInfo(t("messages.password_reset_sent"));
    } catch {
      showError(tCommon("save_failed"));
    }
  };

  const handleToggleStatus = async (user: SettingsUserRecord) => {
    try {
      await setUserStatus(
        user.id,
        user.status === "inactive" ? "active" : "inactive",
      );
      await refresh();
      showSuccess(
        user.status === "inactive"
          ? t("messages.activated")
          : t("messages.deactivated"),
      );
    } catch {
      showError(tCommon("save_failed"));
    }
  };

  const columns = [
    {
      key: "fullName",
      label: t("table.name"),
      searchable: true,
      render: (value: unknown, row: Record<string, unknown>) => {
        const user = row as unknown as SettingsUserRecord;
        return (
          <div>
            <p className="font-semibold text-gray-900">{String(value)}</p>
            <p className="mt-1 text-xs text-gray-500">{user.email}</p>
          </div>
        );
      },
    },
    {
      key: "roleId",
      label: t("table.role"),
      render: (value: unknown) => rolesMap.get(String(value)) || String(value),
    },
    {
      key: "status",
      label: t("table.status"),
      render: (value: unknown) => (
        <SettingsStatusBadge status={value as SettingsUserRecord["status"]} />
      ),
    },
    {
      key: "lastActiveAt",
      label: t("table.last_active"),
      render: (value: unknown) =>
        value ? new Date(String(value)).toLocaleString() : t("not_available"),
    },
    {
      key: "id",
      label: t("table.actions"),
      sortable: false,
      render: (_value: unknown, row: Record<string, unknown>) => {
        const user = row as unknown as SettingsUserRecord;
        return (
          <div className="flex flex-wrap gap-2">
            {hasPermission("settings.users.manage") ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 rounded-lg border border-gray-200 p-0"
                  title={tCommon("edit")}
                  aria-label={tCommon("edit")}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedUser(user);
                    setModalMode("edit");
                  }}
                >
                  <Pencil className="h-4 w-4 text-info" />
                </Button>
                {user.status === "invited" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 rounded-lg border border-gray-200 p-0"
                    title={t("resend_invite")}
                    aria-label={t("resend_invite")}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleResendInvite(user.id);
                    }}
                  >
                    <Mail className="h-4 w-4 text-red-400" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 rounded-lg border border-gray-200 p-0"
                    title={t("reset_password")}
                    aria-label={t("reset_password")}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handlePasswordReset(user.id);
                    }}
                  >
                    <KeyRound className="h-4 w-4 text-warning" />
                  </Button>
                )}
                <Button
                  variant={user.status === "inactive" ? "primary" : "ghost"}
                  size="sm"
                  className={`h-9 w-9 rounded-lg p-0 ${
                    user.status === "inactive" ? "" : "border border-gray-200"
                  }`}
                  title={
                    user.status === "inactive" ? t("activate") : t("deactivate")
                  }
                  aria-label={
                    user.status === "inactive" ? t("activate") : t("deactivate")
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleToggleStatus(user);
                  }}
                >
                  {user.status === "inactive" ? (
                    <UserCheck className="h-4 w-4" />
                  ) : (
                    <UserX className="h-4 w-4" />
                  )}
                </Button>
              </>
            ) : null}
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return <MainLoader />;
  }

  return (
    <SettingsAccessGuard permission="settings.users.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
        <SettingsPageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            hasPermission("settings.users.manage") ? (
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
                  leftIcon={<MailPlus className="h-4 w-4" />}
                  onClick={() => {
                    setSelectedUser(null);
                    setModalMode("invite");
                  }}
                >
                  {t("invite_user")}
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<UserPlus className="h-4 w-4" />}
                  onClick={() => {
                    setSelectedUser(null);
                    setModalMode("create");
                  }}
                >
                  {t("create_user")}
                </Button>
              </div>
            ) : null
          }
        />

        <SettingsSectionCard
          title={t("directory_title")}
          description={t("directory_description")}
          actions={
            <Button
              variant="secondary"
              leftIcon={<RefreshCcw className="h-4 w-4" />}
              onClick={() => void refresh()}
            >
              {t("refresh")}
            </Button>
          }
        >
          <div className="mb-4">
            <FilterPanel
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((current) => !current)}
              hasActiveFilters={hasActiveFilters}
              toggleTitle={t("filter_button")}
              toggleAriaLabel={t("filter_button")}
              className="bg-transparent p-0 shadow-none"
              clearAction={null}
              searchSlot={
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-60 flex-1">
                    <Input
                      value={search}
                      onChange={(event) =>
                        setValue("search", event.target.value, "replace")
                      }
                      placeholder={t("search")}
                    />
                  </div>
                  {hasActiveFilters ? (
                    <Button
                      variant="outline"
                      leftIcon={<X className="h-4 w-4" />}
                      onClick={() => reset(undefined, "replace")}
                    >
                      {t("clear_filters")}
                    </Button>
                  ) : null}
                </div>
              }
              filtersSlot={
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Select
                    label={t("filters.role")}
                    value={roleFilter}
                    onChange={(value) => setValue("role", value, "push")}
                    options={[
                      { value: "all", label: tCommon("all") },
                      ...roles.map((role) => ({
                        value: role.id,
                        label: role.name,
                      })),
                    ]}
                  />
                  <Select
                    label={t("filters.status")}
                    value={statusFilter}
                    onChange={(value) => setValue("status", value, "push")}
                    options={[
                      { value: "all", label: tCommon("all") },
                      { value: "active", label: t("statuses.active") },
                      { value: "invited", label: t("statuses.invited") },
                      { value: "inactive", label: t("statuses.inactive") },
                    ]}
                  />
                </div>
              }
            />
          </div>

          <DataTable
            columns={columns}
            data={filteredUsers as unknown as Record<string, unknown>[]}
            showPagination
            itemsPerPage={10}
            searchQuery={search}
            onRowClick={(row) => {
              if (!hasPermission("settings.users.manage")) {
                return;
              }
              setSelectedUser(row as unknown as SettingsUserRecord);
              setModalMode("edit");
            }}
          />
        </SettingsSectionCard>

        <UserEditorModal
          isOpen={modalMode !== null}
          mode={modalMode || "create"}
          user={selectedUser}
          roles={roles}
          onClose={() => {
            setModalMode(null);
            setSelectedUser(null);
          }}
          onSubmit={handleModalSubmit}
        />
        <SettingsGlobalExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExport}
          datasetCount={filteredUsers.length}
          emptyStateMessage={tExport("errors.noData")}
        />
      </main>
    </SettingsAccessGuard>
  );
}
