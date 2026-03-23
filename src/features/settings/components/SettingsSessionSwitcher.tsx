"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Select from "@/components/ui/input/Select";
import { fetchRoles, fetchUsers, setCurrentSettingsSessionUser } from "@/features/settings/services/settingsService";
import type { RoleDefinition, SettingsUserRecord } from "@/features/settings/types";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/components/ui/toast/Toast";

export default function SettingsSessionSwitcher() {
  const t = useTranslations("settings.session");
  const { currentUser } = usePermissions();
  const { showError, showSuccess } = useToast();
  const [users, setUsers] = useState<SettingsUserRecord[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      try {
        const [nextUsers, nextRoles] = await Promise.all([fetchUsers(), fetchRoles()]);
        if (cancelled) {
          return;
        }
        setUsers(nextUsers.filter((user) => user.status !== "inactive"));
        setRoles(nextRoles);
      } catch {
        if (!cancelled) {
          showError(t("load_failed"));
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [showError, t]);

  const roleMap = useMemo(() => new Map(roles.map((role) => [role.id, role.name])), [roles]);

  const options = users.map((user) => ({
    value: user.id,
    label: `${user.fullName} - ${roleMap.get(user.roleId) || user.roleId}`,
  }));

  return (
    <div className="min-w-[260px]">
      <Select
        label={t("label")}
        value={currentUser.id}
        onChange={(nextValue) => {
          void setCurrentSettingsSessionUser(nextValue)
            .then(() => showSuccess(t("switched")))
            .catch(() => showError(t("switch_failed")));
        }}
        options={options}
      />
    </div>
  );
}
