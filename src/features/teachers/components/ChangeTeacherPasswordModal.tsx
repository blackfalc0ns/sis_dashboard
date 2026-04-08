"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button, Modal } from "@/components/ui";
import type {
  ChangeTeacherPasswordFormData,
  Teacher,
} from "@/features/teachers/types";
import { getTeacherDisplayName } from "@/features/teachers/utils/teacherMappers";
import { validateTeacherPasswordForm } from "@/features/teachers/utils/teacherValidation";

interface ChangeTeacherPasswordModalProps {
  isOpen: boolean;
  teacher: Teacher | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (data: ChangeTeacherPasswordFormData) => Promise<void> | void;
}

export default function ChangeTeacherPasswordModal({
  isOpen,
  teacher,
  isSubmitting = false,
  onClose,
  onSubmit,
}: ChangeTeacherPasswordModalProps) {
  const t = useTranslations("teachers");
  const locale = useLocale();
  const displayLocale = locale === "ar" ? "ar" : "en";

  const [formData, setFormData] = useState<ChangeTeacherPasswordFormData>({
    newPassword: "",
    confirmNewPassword: "",
  });
  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmNewPassword?: string;
  }>({});
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData({
      newPassword: "",
      confirmNewPassword: "",
    });
    setErrors({});
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }, [isOpen, teacher]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!teacher) {
    return null;
  }

  const resolveError = (errorKey?: string) =>
    errorKey ? t(errorKey) : undefined;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = validateTeacherPasswordForm(formData);
    setErrors(result.errors);

    if (!result.isValid) {
      return;
    }

    await onSubmit(result.normalizedData);
  };

  const renderPasswordField = ({
    id,
    label,
    value,
    showPassword,
    error,
    onToggle,
    onChange,
  }: {
    id: keyof ChangeTeacherPasswordFormData;
    label: string;
    value: string;
    showPassword: boolean;
    error?: string;
    onToggle: () => void;
    onChange: (value: string) => void;
  }) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors ${
            error
              ? "border-red-500 focus:border-red-500"
              : "border-gray-200 focus:border-primary"
          }`}
          autoComplete="new-password"
          disabled={isSubmitting}
        />
        <button
          type="button"
          className={`absolute top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 ${
            locale === "ar" ? "left-3" : "right-3"
          }`}
          onClick={onToggle}
          aria-label={label}
          title={label}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("change_password.title")}
      description={t("change_password.description", {
        teacher: getTeacherDisplayName(teacher, displayLocale),
      })}
      size="sm"
      icon={<KeyRound className="h-5 w-5" />}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t("actions.cancel")}
          </Button>
          <Button
            type="submit"
            form="change-teacher-password-form"
            loading={isSubmitting}
          >
            {t("change_password.submit")}
          </Button>
        </>
      }
    >
      <form
        id="change-teacher-password-form"
        className="space-y-4 pb-2"
        onSubmit={handleSubmit}
      >
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          {t("change_password.helper")}
        </div>
        {renderPasswordField({
          id: "newPassword",
          label: t("change_password.new_password"),
          value: formData.newPassword,
          showPassword: showNewPassword,
          error: resolveError(errors.newPassword),
          onToggle: () => setShowNewPassword((current) => !current),
          onChange: (value) =>
            setFormData((current) => ({
              ...current,
              newPassword: value,
            })),
        })}
        {renderPasswordField({
          id: "confirmNewPassword",
          label: t("change_password.confirm_new_password"),
          value: formData.confirmNewPassword,
          showPassword: showConfirmPassword,
          error: resolveError(errors.confirmNewPassword),
          onToggle: () => setShowConfirmPassword((current) => !current),
          onChange: (value) =>
            setFormData((current) => ({
              ...current,
              confirmNewPassword: value,
            })),
        })}
      </form>
    </Modal>
  );
}
