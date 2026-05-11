// FILE: src/components/students-guardians/modals/AddGuardianModal.tsx

"use client";

import { useState } from "react";
import { XCircle, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

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
    <div className="fixed inset-0 bg-black/50  flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">{t("title")}</h3>
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6">
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
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    placeholder={t("full_name_placeholder")}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("relation")}{" "}
                    <span className="text-red-500">{t("required")}</span>
                  </label>
                  <select
                    required
                    value={formData.relation}
                    onChange={(e) =>
                      setFormData({ ...formData, relation: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="father">{t("father")}</option>
                    <option value="mother">{t("mother")}</option>
                    <option value="guardian">{t("guardian")}</option>
                    <option value="other">{t("other")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("national_id_label")}
                  </label>
                  <input
                    type="text"
                    value={formData.national_id ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, national_id: e.target.value || null })
                    }
                    placeholder={t("national_id_placeholder")}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
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
                  <input
                    type="tel"
                    value={formData.phone_primary ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone_primary: e.target.value || null,
                      })
                    }
                    placeholder={t("primary_phone_placeholder")}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("secondary_phone")}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_secondary ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone_secondary: e.target.value || null,
                      })
                    }
                    placeholder={t("secondary_phone_placeholder")}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("email")}{" "}
                    <span className="text-red-500">{t("required")}</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder={t("email_placeholder")}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
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
                  <input
                    type="text"
                    value={formData.job_title ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, job_title: e.target.value || null })
                    }
                    placeholder={t("job_title_placeholder")}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("workplace")}
                  </label>
                  <input
                    type="text"
                    value={formData.workplace ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, workplace: e.target.value || null })
                    }
                    placeholder={t("workplace_placeholder")}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
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
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_primary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_primary: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {t("set_as_primary")}
                    </span>
                    <p className="text-xs text-gray-500">
                      {t("primary_contact")}
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.can_pickup}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        can_pickup: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {t("can_pickup_student")}
                    </span>
                    <p className="text-xs text-gray-500">{t("allow_pickup")}</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.can_receive_notifications}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        can_receive_notifications: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {t("receive_notifications")}
                    </span>
                    <p className="text-xs text-gray-500">
                      {t("send_notifications")}
                    </p>
                  </div>
                </label>
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

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            >
              {isSubmitting && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {isSubmitting ? "Saving…" : t("add")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
