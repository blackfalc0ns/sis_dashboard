// FILE: src/components/admissions/EnrollmentForm.tsx

"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { X, FileText, Download } from "lucide-react";
import { Application } from "@/types/admissions";

interface EnrollmentFormProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function EnrollmentForm({
  application,
  isOpen,
  onClose,
  onSubmit,
}: EnrollmentFormProps) {
  const t = useTranslations("admissions.enrollment_form");
  const locale = useLocale();
  const [formData, setFormData] = useState({
    academicYear: "2024-2025",
    grade: application.gradeRequested,
    section: "",
    startDate: "",
  });

  if (!isOpen) return null;

  const studentName =
    locale === "ar"
      ? application.full_name_ar ||
        application.studentNameArabic ||
        application.studentName
      : application.full_name_en || application.studentName;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleGenerateAcceptance = () => {
    alert(t("acceptance_generated"));
  };

  const handleGenerateContract = () => {
    alert(t("contract_generated"));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
            <p className="text-sm text-gray-500">
              {studentName} - {application.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Student Info Summary */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-600" />
              <p className="text-sm font-semibold text-emerald-900">
                {t("application_accepted")}
              </p>
            </div>
            <p className="text-sm text-emerald-700">
              {t("ready_for_enrollment")}
            </p>
          </div>

          {/* Enrollment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("academic_year")} *
              </label>
              <select
                value={formData.academicYear}
                onChange={(e) =>
                  setFormData({ ...formData, academicYear: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                required
              >
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("grade")} *
              </label>
              <select
                value={formData.grade}
                onChange={(e) =>
                  setFormData({ ...formData, grade: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                  <option key={grade} value={`Grade ${grade}`}>
                    {t("grade_option", { grade })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("section")} *
              </label>
              <select
                value={formData.section}
                onChange={(e) =>
                  setFormData({ ...formData, section: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                required
              >
                <option value="">{t("select_section")}</option>
                <option value="A">
                  {t("section_option", { section: "A" })}
                </option>
                <option value="B">
                  {t("section_option", { section: "B" })}
                </option>
                <option value="C">
                  {t("section_option", { section: "C" })}
                </option>
                <option value="D">
                  {t("section_option", { section: "D" })}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("start_date")} *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm"
                required
              />
            </div>
          </div>

          {/* Document Generation */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              {t("generate_documents")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGenerateAcceptance}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
              >
                <FileText className="w-4 h-4" />
                {t("generate_acceptance")}
              </button>
              <button
                type="button"
                onClick={handleGenerateContract}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                {t("generate_contract")}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              {t("confirm_enrollment")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
