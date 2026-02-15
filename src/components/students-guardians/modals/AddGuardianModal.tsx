// FILE: src/components/students-guardians/modals/AddGuardianModal.tsx

"use client";

import { useState } from "react";
import { XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface AddGuardianModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (guardianData: GuardianFormData) => void;
  studentId: string;
}

export interface GuardianFormData {
  full_name: string;
  relation: string;
  phone_primary: string;
  phone_secondary: string;
  email: string;
  national_id: string;
  job_title: string;
  workplace: string;
  is_primary: boolean;
  can_pickup: boolean;
  can_receive_notifications: boolean;
}

export default function AddGuardianModal({
  isOpen,
  onClose,
  onSubmit,
  studentId,
}: AddGuardianModalProps) {
  const t = useTranslations(
    "students_guardians.profile.guardians.add_guardian_modal",
  );
  const [formData, setFormData] = useState<GuardianFormData>({
    full_name: "",
    relation: "father",
    phone_primary: "",
    phone_secondary: "",
    email: "",
    national_id: "",
    job_title: "",
    workplace: "",
    is_primary: false,
    can_pickup: true,
    can_receive_notifications: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleReset();
  };

  const handleReset = () => {
    setFormData({
      full_name: "",
      relation: "father",
      phone_primary: "",
      phone_secondary: "",
      email: "",
      national_id: "",
      job_title: "",
      workplace: "",
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  >
                    <option value="father">{t("father")}</option>
                    <option value="mother">{t("mother")}</option>
                    <option value="guardian">{t("guardian")}</option>
                    <option value="other">{t("other")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("national_id_label")}{" "}
                    <span className="text-red-500">{t("required")}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.national_id}
                    onChange={(e) =>
                      setFormData({ ...formData, national_id: e.target.value })
                    }
                    placeholder={t("national_id_placeholder")}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
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
                    {t("primary_phone")}{" "}
                    <span className="text-red-500">{t("required")}</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone_primary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone_primary: e.target.value,
                      })
                    }
                    placeholder={t("primary_phone_placeholder")}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("secondary_phone")}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_secondary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone_secondary: e.target.value,
                      })
                    }
                    placeholder={t("secondary_phone_placeholder")}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
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
                    value={formData.job_title}
                    onChange={(e) =>
                      setFormData({ ...formData, job_title: e.target.value })
                    }
                    placeholder={t("job_title_placeholder")}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("workplace")}
                  </label>
                  <input
                    type="text"
                    value={formData.workplace}
                    onChange={(e) =>
                      setFormData({ ...formData, workplace: e.target.value })
                    }
                    placeholder={t("workplace_placeholder")}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
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
                    className="w-4 h-4 text-[#036b80] border-gray-300 rounded focus:ring-[#036b80]"
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
                    className="w-4 h-4 text-[#036b80] border-gray-300 rounded focus:ring-[#036b80]"
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
                    className="w-4 h-4 text-[#036b80] border-gray-300 rounded focus:ring-2 focus:ring-[#036b80]"
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
              className="px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t("add")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
