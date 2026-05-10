// FILE: src/components/leads/CreateLeadModal.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { LeadChannel } from "@/features/admissions/types/enums";
import type { CreateLeadPayload } from "@/features/admissions/leads/types/lead";

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLeadPayload) => void;
}

export default function CreateLeadModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateLeadModalProps) {
  const t = useTranslations("admissions.leads");
  const [formData, setFormData] = useState({
    studentName: "",
    primaryContactName: "",
    phone: "",
    email: "",
    channel: "In-app" as LeadChannel,
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      studentName: formData.studentName,
      primaryContactName: formData.primaryContactName,
      phone: formData.phone,
      email: formData.email || undefined,
      channel: formData.channel,
      notes: formData.notes || undefined,
    });
    // Reset form
    setFormData({
      studentName: "",
      primaryContactName: "",
      phone: "",
      email: "",
      channel: "In-app",
      notes: "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {t("create_new_lead")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-6"
        >
          <div className="space-y-4">
            {/* Student Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("student_name") || "Student Name"} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.studentName}
                onChange={(e) =>
                  setFormData({ ...formData, studentName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={t("student_name_placeholder") || "Enter student name"}
              />
            </div>

            {/* Guardian/Parent Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("guardian_name")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.primaryContactName}
                onChange={(e) =>
                  setFormData({ ...formData, primaryContactName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={t("guardian_name_placeholder")}
              />
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("phone")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={t("phone_placeholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("email")}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={t("email_placeholder")}
                />
              </div>
            </div>

            {/* Channel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("channel")} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.channel}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    channel: e.target.value as LeadChannel,
                  })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="In-app">{t("in_app")}</option>
                <option value="Referral">{t("referral")}</option>
                <option value="Walk-in">{t("walk_in")}</option>
                <option value="Other">{t("other")}</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("notes") || "Notes"}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder={t("notes_placeholder") || "Optional notes about this lead"}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            {t("create_lead")}
          </button>
        </div>
      </div>
    </div>
  );
}
