// FILE: src/components/students-guardians/modals/AddGuardianModal.tsx

"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, Input, Modal, Select } from "@/components/ui";

interface AddGuardianModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (guardianData: GuardianFormData) => Promise<void>;
}

export interface GuardianFormData {
  full_name: string;
  relation: string;
  phone_primary: string | null;
  phone_secondary: string | null;
  email: string;
  national_id: string | null;
  job_title: string | null;
  workplace: string | null;
  is_primary: boolean;
  can_pickup: boolean;
  can_receive_notifications: boolean;
}

export default function AddGuardianModal({
  isOpen,
  onClose,
  onSubmit,
}: AddGuardianModalProps) {
  const t = useTranslations(
    "students_guardians.profile.guardians.add_guardian_modal",
  );
  const [formData, setFormData] = useState<GuardianFormData>({
    full_name: "",
    relation: "father",
    phone_primary: null,
    phone_secondary: null,
    email: "",
    national_id: null,
    job_title: null,
    workplace: null,
    is_primary: false,
    can_pickup: true,
    can_receive_notifications: true,
  });

  const [submitError, setSubmitError] = useState<string[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Parse API error shape → list of human-readable messages */
  const parseApiError = (err: unknown): string[] => {
    if (err && typeof err === "object") {
      const e = err as Record<string, unknown>;
      // Axios wraps response in .response.data
      const data =
        (e.response as Record<string, unknown>)?.data ?? e;
      if (data && typeof data === "object") {
        const d = data as Record<string, unknown>;
        const fields = (d.details as Record<string, unknown>)?.fields;
        if (Array.isArray(fields) && fields.length > 0)
          return fields as string[];
        if (typeof d.message === "string") return [d.message];
      }
      if (err instanceof Error) return [err.message];
    }
    return ["An unexpected error occurred. Please try again."];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      handleReset();
    } catch (err) {
      setSubmitError(parseApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitError(null);
    setFormData({
      full_name: "",
      relation: "father",
      phone_primary: null,
      phone_secondary: null,
      email: "",
      national_id: null,
      job_title: null,
      workplace: null,
      is_primary: false,
      can_pickup: true,
      can_receive_notifications: true,
    });
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={t("title")}
      size="lg"
      showCloseButton={!isSubmitting}
      closeOnOverlayClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
      footer={
        <>
          <Button
            type="button"
            onClick={handleCancel}
            variant="secondary"
            disabled={isSubmitting}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form="add-guardian-form"
            loading={isSubmitting}
          >
            {isSubmitting ? "Saving…" : t("add")}
          </Button>
        </>
      }
    >
        <form id="add-guardian-form" onSubmit={handleSubmit}>
          <div className="space-y-6 pb-4">
            {/* Personal Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                {t("personal_information")}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("full_name")}{" "}
                    <span className="text-red-500">{t("required")}</span>
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    placeholder={t("full_name_placeholder")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("relation")}{" "}
                    <span className="text-red-500">{t("required")}</span>
                  </label>
                  <Select
                    required
                    value={formData.relation}
                    onChange={(value) =>
                      setFormData({ ...formData, relation: value })
                    }
                    options={[
                      { value: "father", label: t("father") },
                      { value: "mother", label: t("mother") },
                      { value: "guardian", label: t("guardian") },
                      { value: "other", label: t("other") },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("national_id_label")}
                  </label>
                  <Input
                    type="text"
                    value={formData.national_id ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, national_id: e.target.value || null })
                    }
                    placeholder={t("national_id_placeholder")}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                {t("contact_information")}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("primary_phone")}
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone_primary ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone_primary: e.target.value || null,
                      })
                    }
                    placeholder={t("primary_phone_placeholder")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("secondary_phone")}
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone_secondary ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone_secondary: e.target.value || null,
                      })
                    }
                    placeholder={t("secondary_phone_placeholder")}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("email")}{" "}
                    <span className="text-red-500">{t("required")}</span>
                  </label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder={t("email_placeholder")}
                  />
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                {t("employment_information")}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("job_title")}
                  </label>
                  <Input
                    type="text"
                    value={formData.job_title ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, job_title: e.target.value || null })
                    }
                    placeholder={t("job_title_placeholder")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("workplace")}
                  </label>
                  <Input
                    type="text"
                    value={formData.workplace ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, workplace: e.target.value || null })
                    }
                    placeholder={t("workplace_placeholder")}
                  />
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                {t("permissions_settings")}
              </h4>
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  className={`justify-start rounded-lg border p-3 text-left ${
                    formData.is_primary ? "border-primary bg-primary/5" : "border-gray-200"
                  }`}
                  onClick={() =>
                      setFormData({
                        ...formData,
                        is_primary: !formData.is_primary,
                      })
                    }
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {t("set_as_primary")}
                    </span>
                    <p className="text-xs text-gray-500">
                      {t("primary_contact")}
                    </p>
                  </div>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  className={`justify-start rounded-lg border p-3 text-left ${
                    formData.can_pickup ? "border-primary bg-primary/5" : "border-gray-200"
                  }`}
                  onClick={() =>
                      setFormData({
                        ...formData,
                        can_pickup: !formData.can_pickup,
                      })
                    }
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {t("can_pickup_student")}
                    </span>
                    <p className="text-xs text-gray-500">{t("allow_pickup")}</p>
                  </div>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  className={`justify-start rounded-lg border p-3 text-left ${
                    formData.can_receive_notifications ? "border-primary bg-primary/5" : "border-gray-200"
                  }`}
                  onClick={() =>
                      setFormData({
                        ...formData,
                        can_receive_notifications: !formData.can_receive_notifications,
                      })
                    }
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {t("receive_notifications")}
                    </span>
                    <p className="text-xs text-gray-500">
                      {t("send_notifications")}
                    </p>
                  </div>
                </Button>
              </div>
            </div>
          </div>

          {/* Validation / API error banner */}
          {submitError && (
            <div className="mx-6 mb-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <ul className="flex-1 space-y-1">
                  {submitError.map((msg, i) => (
                    <li key={i} className="text-sm text-red-700">
                      {msg}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

        </form>
    </Modal>
  );
}
