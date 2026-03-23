"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import Button from "@/components/ui/button/Button";
import type { RoleDefinition, SettingsUserRecord } from "@/features/settings/types";

interface UserEditorModalProps {
  isOpen: boolean;
  mode: "create" | "invite" | "edit";
  user?: SettingsUserRecord | null;
  roles: RoleDefinition[];
  onClose: () => void;
  onSubmit: (payload: {
    fullName: string;
    email: string;
    roleId: string;
  }) => Promise<void>;
}

export default function UserEditorModal({
  isOpen,
  mode,
  user,
  roles,
  onClose,
  onSubmit,
}: UserEditorModalProps) {
  const t = useTranslations("settings.users");
  const tCommon = useTranslations("common");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setFullName(user?.fullName || "");
    setEmail(user?.email || "");
    setRoleId(user?.roleId || roles[0]?.id || "");
    setIsSaving(false);
  }, [isOpen, roles, user]);

  const isValid = useMemo(
    () => Boolean(fullName.trim() && email.trim() && roleId),
    [email, fullName, roleId],
  );

  const handleSubmit = async () => {
    if (!isValid) {
      return;
    }
    setIsSaving(true);
    try {
      await onSubmit({
        fullName: fullName.trim(),
        email: email.trim(),
        roleId,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === "create"
          ? t("create_user")
          : mode === "invite"
            ? t("invite_user")
            : t("edit_user")
      }
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!isValid || isSaving}>
            {isSaving
              ? tCommon("saving")
              : mode === "invite"
                ? t("send_invite")
                : tCommon("save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label={t("table.name")}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
        <Input
          label={t("table.email")}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={mode === "edit"}
        />
        <Select
          label={t("filters.role")}
          value={roleId}
          onChange={setRoleId}
          options={roles.map((role) => ({
            value: role.id,
            label: role.name,
          }))}
        />
      </div>
    </Modal>
  );
}
