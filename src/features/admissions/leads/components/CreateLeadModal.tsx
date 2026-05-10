// FILE: src/components/leads/CreateLeadModal.tsx

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button, Input, Select, TextArea } from "@/components/ui";
import type { LeadChannel, LeadStatus } from "@/features/admissions/types/enums";
import type {
  CreateLeadPayload,
  Lead,
  UpdateLeadPayload,
} from "@/features/admissions/leads/types/lead";
import {
  getValidationFieldErrors,
  type ValidationFieldErrors,
} from "@/lib/validation-errors";

type LeadModalPayload = CreateLeadPayload & Partial<Pick<UpdateLeadPayload, "status">>;

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LeadModalPayload) => Promise<void> | void;
  initialLead?: Lead | null;
  mode?: "create" | "update";
}

const defaultFormData = {
  studentName: "",
  primaryContactName: "",
  phone: "",
  email: "",
  channel: "In-app" as LeadChannel,
  status: "New" as LeadStatus,
  notes: "",
};

export default function CreateLeadModal({
  isOpen,
  onClose,
  onSubmit,
  initialLead = null,
  mode = "create",
}: CreateLeadModalProps) {
  const t = useTranslations("admissions.leads");
  const isUpdateMode = mode === "update";
  const [formData, setFormData] = useState(defaultFormData);
  const [fieldErrors, setFieldErrors] = useState<ValidationFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData(defaultFormData);
    setFieldErrors({});
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (initialLead) {
      setFormData({
        studentName: initialLead.studentName || "",
        primaryContactName: initialLead.primaryContactName || "",
        phone: initialLead.phone || "",
        email: initialLead.email || "",
        channel: initialLead.channel || "In-app",
        status: initialLead.status || "New",
        notes: initialLead.notes || "",
      });
      setFieldErrors({});
      return;
    }

    resetForm();
  }, [initialLead, isOpen]);

  const updateField = (
    field: keyof typeof formData,
    value: (typeof formData)[keyof typeof formData],
  ) => {
    setFormData({ ...formData, [field]: value });
    if (fieldErrors[field]) {
      setFieldErrors((currentErrors) => {
        const nextErrors = { ...currentErrors };
        delete nextErrors[field];
        return nextErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const payload: LeadModalPayload = {
        studentName: formData.studentName,
        primaryContactName: formData.primaryContactName,
        phone: formData.phone,
        email: formData.email || undefined,
        channel: formData.channel,
        notes: formData.notes || undefined,
      };

      if (isUpdateMode) {
        payload.status = formData.status;
      }

      await onSubmit(payload);
      resetForm();
    } catch (error) {
      const errors = getValidationFieldErrors(error);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isUpdateMode ? t("edit_lead") : t("create_new_lead")}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form
          id="lead-editor-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-6"
        >
          <div className="space-y-4">
            <Input
              label={t("student_name")}
              required
              value={formData.studentName}
              onChange={(e) => updateField("studentName", e.target.value)}
              placeholder={t("student_name_placeholder")}
              error={fieldErrors.studentName}
            />

            <Input
              label={t("guardian_name")}
              required
              value={formData.primaryContactName}
              onChange={(e) =>
                updateField("primaryContactName", e.target.value)
              }
              placeholder={t("guardian_name_placeholder")}
              error={fieldErrors.primaryContactName}
            />

            {/* Phone & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="tel"
                label={t("phone")}
                required
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder={t("phone_placeholder")}
                error={fieldErrors.phone}
              />
              <Input
                type="email"
                label={t("email")}
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder={t("email_placeholder")}
                error={fieldErrors.email}
              />
            </div>

            <div
              className={
                isUpdateMode
                  ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                  : "grid grid-cols-1 gap-4"
              }
            >
              <Select
                label={t("channel")}
                required
                value={formData.channel}
                onChange={(value) => updateField("channel", value as LeadChannel)}
                error={fieldErrors.channel}
                options={[
                  { value: "In-app", label: t("in_app") },
                  { value: "Referral", label: t("referral") },
                  { value: "Walk-in", label: t("walk_in") },
                  { value: "Other", label: t("other") },
                ]}
              />
              {isUpdateMode ? (
                <Select
                  label={t("status")}
                  required
                  value={formData.status}
                  onChange={(value) =>
                    updateField("status", value as LeadStatus)
                  }
                  error={fieldErrors.status}
                  options={[
                    { value: "New", label: t("new") },
                    { value: "Contacted", label: t("contacted") },
                    { value: "Converted", label: t("converted") },
                    { value: "Closed", label: t("closed") },
                  ]}
                />
              ) : null}
            </div>

            <TextArea
              label={t("notes")}
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
              resize="none"
              placeholder={t("notes_placeholder")}
              error={fieldErrors.notes}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <Button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            variant="secondary"
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form="lead-editor-form"
            loading={isSubmitting}
          >
            {isUpdateMode ? t("update_lead") : t("create_lead")}
          </Button>
        </div>
      </div>
    </div>
  );
}
