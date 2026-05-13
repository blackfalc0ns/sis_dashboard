"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Modal from "@/components/ui/modal/Modal";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import Button from "@/components/ui/button/Button";
import {
  checkUsernameAvailability,
  previewLoginIdentityUsername,
} from "@/features/settings/login-identity/services/loginIdentityService";
import type {
  UsernameAvailabilityResponse,
  UsernamePreviewResponse,
} from "@/features/settings/login-identity/types";
import type {
  RoleDefinition,
  SettingsUserRecord,
} from "@/features/settings/types";

type UserEditorField = "fullName" | "username" | "contactEmail" | "email" | "roleId";

interface UserEditorModalProps {
  isOpen: boolean;
  mode: "create" | "invite" | "edit";
  user?: SettingsUserRecord | null;
  roles: RoleDefinition[];
  errors?: Partial<Record<UserEditorField, string>>;
  formError?: string | null;
  onFieldChange?: (field: UserEditorField) => void;
  onClose: () => void;
  onSubmit: (payload: {
    fullName: string;
    username?: string;
    contactEmail?: string;
    email?: string;
    roleId: string;
  }) => Promise<void>;
}

export default function UserEditorModal({
  isOpen,
  mode,
  user,
  roles,
  errors,
  formError,
  onFieldChange,
  onClose,
  onSubmit,
}: UserEditorModalProps) {
  const t = useTranslations("settings.users");
  const tCommon = useTranslations("common");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState<UsernamePreviewResponse | null>(null);
  const [availability, setAvailability] =
    useState<UsernameAvailabilityResponse | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const usesUsernameFlow = mode !== "edit";
  const generatedLoginEmail = preview?.loginEmail || user?.email || "";
  const isUsernameAvailable = availability?.available ?? null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setFullName(user?.fullName || "");
    setUsername(user?.username || "");
    setContactEmail(user?.contactEmail || "");
    setRoleId(user?.roleId || roles[0]?.id || "");
    setIsSaving(false);
    setPreview(null);
    setAvailability(null);
    setIdentityError(null);
  }, [isOpen, roles, user]);

  useEffect(() => {
    if (!isOpen || !usesUsernameFlow) {
      return;
    }
    const trimmedUsername = username.trim();
    setAvailability(null);
    setIdentityError(null);
    if (!trimmedUsername) {
      setPreview(null);
      setIsPreviewing(false);
      return;
    }

    let cancelled = false;
    setIsPreviewing(true);
    const timeoutId = window.setTimeout(() => {
      void previewLoginIdentityUsername(trimmedUsername)
        .then((nextPreview) => {
          if (!cancelled) {
            setPreview(nextPreview);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setPreview(null);
            setIdentityError(t("identity.preview_failed"));
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsPreviewing(false);
          }
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, t, username, usesUsernameFlow]);

  const isValid = useMemo(
    () =>
      Boolean(
        fullName.trim() &&
          roleId &&
          (usesUsernameFlow
            ? username.trim() && contactEmail.trim()
            : contactEmail.trim() || user?.contactEmail || user?.email),
      ),
    [contactEmail, fullName, roleId, user?.contactEmail, user?.email, username, usesUsernameFlow],
  );

  const handleCheckAvailability = async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setIdentityError(t("identity.username_required"));
      return null;
    }
    setIsCheckingAvailability(true);
    setIdentityError(null);
    try {
      const nextAvailability = await checkUsernameAvailability(trimmedUsername);
      setAvailability(nextAvailability);
      return nextAvailability;
    } catch {
      setAvailability(null);
      setIdentityError(t("identity.availability_failed"));
      return null;
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleSubmit = async () => {
    if (!isValid) {
      return;
    }
    if (usesUsernameFlow) {
      const nextAvailability =
        availability?.username === username.trim()
          ? availability
          : await handleCheckAvailability();
      if (!nextAvailability?.available) {
        setIdentityError(nextAvailability?.reason || t("identity.username_unavailable"));
        return;
      }
    }
    setIsSaving(true);
    try {
      await onSubmit({
        fullName: fullName.trim(),
        username: usesUsernameFlow ? username.trim() : undefined,
        contactEmail: contactEmail.trim() || undefined,
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
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isValid || isSaving}
          >
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
        {formError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        ) : null}
        <Input
          label={t("table.name")}
          value={fullName}
          onChange={(event) => {
            setFullName(event.target.value);
            onFieldChange?.("fullName");
          }}
          error={errors?.fullName}
        />
        {usesUsernameFlow ? (
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <Input
              label={t("table.username")}
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                onFieldChange?.("username");
              }}
              onBlur={() => void handleCheckAvailability()}
              error={errors?.username}
            />
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-gray-700">
                  {t("identity.generated_login_email")}
                </span>
                {isPreviewing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                ) : null}
              </div>
              <p className="mt-1 break-all font-semibold text-gray-900">
                {generatedLoginEmail || t("not_available")}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {t("identity.login_identity_note")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={isCheckingAvailability}
                disabled={!username.trim() || isCheckingAvailability}
                onClick={() => void handleCheckAvailability()}
              >
                {t("identity.check_availability")}
              </Button>
              {availability ? (
                <span
                  className={`inline-flex items-center gap-1 text-sm ${
                    isUsernameAvailable ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {isUsernameAvailable ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {isUsernameAvailable
                    ? t("identity.username_available")
                    : availability.reason || t("identity.username_unavailable")}
                </span>
              ) : null}
            </div>
            {identityError ? (
              <p className="text-sm text-red-600">{identityError}</p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
            <p className="font-medium text-gray-700">
              {t("identity.generated_login_email")}
            </p>
            <p className="mt-1 break-all font-semibold text-gray-900">
              {user?.email || t("not_available")}
            </p>
            {user?.username ? (
              <p className="mt-1 text-xs text-gray-500">
                {t("table.username")}: {user.username}
              </p>
            ) : null}
          </div>
        )}
        <Input
          label={t("table.contact_email")}
          type="email"
          value={contactEmail}
          onChange={(event) => {
            setContactEmail(event.target.value);
            onFieldChange?.("contactEmail");
          }}
          disabled={mode === "edit"}
          error={errors?.contactEmail || errors?.email}
          helperText={
            mode === "edit" ? t("identity.contact_email_read_only") : undefined
          }
        />
        <Select
          label={t("filters.role")}
          value={roleId}
          onChange={(value) => {
            setRoleId(value);
            onFieldChange?.("roleId");
          }}
          options={roles.map((role) => ({
            value: role.id,
            label: role.name,
          }))}
          error={errors?.roleId}
        />
      </div>
    </Modal>
  );
}
