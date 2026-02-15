// FILE: src/components/leads/CreateLeadModal.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { LeadChannel, LeadStatus } from "@/types/leads";

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    phone: string;
    email?: string;
    channel: LeadChannel;
    status: LeadStatus;
    owner: string;
    gradeInterest?: string;
    source?: string;
  }) => void;
}

export default function CreateLeadModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateLeadModalProps) {
  const t = useTranslations("admissions.leads");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    channel: "In-app" as LeadChannel,
    status: "New" as LeadStatus,
    gradeInterest: "",
    source: "",
    studentName: "",
    studentNameArabic: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      owner: "System", // Default owner
      email: formData.email || undefined,
      gradeInterest: formData.gradeInterest || undefined,
      source: formData.source || undefined,
    });
    // Reset form
    setFormData({
      name: "",
      phone: "",
      email: "",
      channel: "In-app",
      status: "New",
      gradeInterest: "",
      source: "",
      studentName: "",
      studentNameArabic: "",
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
            {/* Guardian/Parent Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("guardian_name")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  placeholder={t("email_placeholder")}
                />
              </div>
            </div>

            {/* Student Name (English & Arabic) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("student_name_en")}
                </label>
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(e) =>
                    setFormData({ ...formData, studentName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  placeholder={t("student_name_en_placeholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("student_name_ar")}
                </label>
                <input
                  type="text"
                  value={formData.studentNameArabic}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      studentNameArabic: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  placeholder={t("student_name_ar_placeholder")}
                  dir="rtl"
                />
              </div>
            </div>

            {/* Grade Interest */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("grade_interest")}
              </label>
              <input
                type="text"
                value={formData.gradeInterest}
                onChange={(e) =>
                  setFormData({ ...formData, gradeInterest: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                placeholder={t("grade_placeholder")}
              />
            </div>

            {/* Channel & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                >
                  <option value="In-app">{t("in_app")}</option>
                  <option value="Referral">{t("referral")}</option>
                  <option value="Walk-in">{t("walk_in")}</option>
                  <option value="Other">{t("other")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("status")} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as LeadStatus,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                >
                  <option value="New">{t("new")}</option>
                  <option value="Contacted">{t("contacted")}</option>
                  <option value="Converted">{t("converted")}</option>
                  <option value="Closed">{t("closed")}</option>
                </select>
              </div>
            </div>

            {/* Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("source")}
              </label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                placeholder={t("source_placeholder")}
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
            className="px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-sm font-medium transition-colors"
          >
            {t("create_lead")}
          </button>
        </div>
      </div>
    </div>
  );
}
