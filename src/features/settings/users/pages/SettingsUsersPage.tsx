"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { MailPlus, RefreshCcw, UserPlus } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { DataTable } from "@/components/ui/data-table";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import SettingsStatusBadge from "@/features/settings/components/SettingsStatusBadge";
import UserEditorModal from "@/features/settings/components/UserEditorModal";
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
import type { RoleDefinition, SettingsUserRecord } from "@/features/settings/types";
import { usePermissions } from "@/hooks/usePermissions";

export default function SettingsUsersPage() {
  const t = useTranslations("settings.users");
  const tCommon = useTranslations("common");
  const { hasPermission } = usePermissions();
  const { showSuccess, showError, showInfo } = useToast();
  const [users, setUsers] = useState<SettingsUserRecord[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalMode, setModalMode] = useState<"create" | "invite" | "edit" | null>(null);
  const [selectedUser, setSelectedUser] = useState<SettingsUserRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      setIsLoading(true);
      try {
        const [nextUsers, nextRoles] = await Promise.all([fetchUsers(), fetchRoles()]);
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

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesSearch =
          !search.trim() ||
          user.fullName.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === "all" || user.roleId === roleFilter;
        const matchesStatus = statusFilter === "all" || user.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
      }),
    [roleFilter, search, statusFilter, users],
  );

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
      await setUserStatus(user.id, user.status === "inactive" ? "active" : "inactive");
      await refresh();
      showSuccess(
        user.status === "inactive" ? t("messages.activated") : t("messages.deactivated"),
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
                  variant="secondary"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedUser(user);
                    setModalMode("edit");
                  }}
                >
                  {tCommon("edit")}
                </Button>
                {user.status === "invited" ? (
                  <Button
                    variant="secondary"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleResendInvite(user.id);
                    }}
                  >
                    {t("resend_invite")}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handlePasswordReset(user.id);
                    }}
                  >
                    {t("reset_password")}
                  </Button>
                )}
                <Button
                  variant={user.status === "inactive" ? "primary" : "secondary"}
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleToggleStatus(user);
                  }}
                >
                  {user.status === "inactive" ? t("activate") : t("deactivate")}
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
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              label={t("search")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select
              label={t("filters.role")}
              value={roleFilter}
              onChange={setRoleFilter}
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
              onChange={setStatusFilter}
              options={[
                { value: "all", label: tCommon("all") },
                { value: "active", label: t("statuses.active") },
                { value: "invited", label: t("statuses.invited") },
                { value: "inactive", label: t("statuses.inactive") },
              ]}
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
      </main>
    </SettingsAccessGuard>
  );
}
