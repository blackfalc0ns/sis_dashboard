"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Input from "@/components/ui/input/Input";
import Button from "@/components/ui/button/Button";

interface RoleEditorModalProps {
  isOpen: boolean;
  mode: "create" | "clone" | "edit";
  sourceRoleName?: string;
  initialValues?: { name: string; description: string } | null;
  onClose: () => void;
  onSubmit: (payload: { name: string; description: string }) => Promise<void>;
}

export default function RoleEditorModal({
  isOpen,
  mode,
  sourceRoleName,
  initialValues,
  onClose,
  onSubmit,
}: RoleEditorModalProps) {
  const t = useTranslations("settings.roles");
  const tCommon = useTranslations("common");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(
      mode === "clone" && sourceRoleName
        ? `${sourceRoleName} Copy`
        : initialValues?.name || "",
    );
    setDescription(initialValues?.description || "");
    setIsSaving(false);
  }, [initialValues, isOpen, mode, sourceRoleName]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      return;
    }
    setIsSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
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
          ? t("create_role")
          : mode === "clone"
            ? t("clone_role")
            : t("edit_role")
      }
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!name.trim() || isSaving}>
            {isSaving
              ? tCommon("saving")
              : mode === "create"
                ? t("create_role")
                : mode === "clone"
                  ? t("clone_role")
                  : tCommon("save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label={t("role_name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("role_name_placeholder")}
        />
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {t("role_description")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("role_description_placeholder")}
            className="min-h-28 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
    </Modal>
  );
}
