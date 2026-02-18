// FILE: src/components/students-guardians/transfers-withdrawals/modals/CreateTransferModal.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Search, Upload } from "lucide-react";
import { getAllStudents } from "@/services/studentsService";
import type { Student } from "@/types/students";
import type { TransferApplication } from "@/types/students/transfers-withdrawals";

interface CreateTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<TransferApplication>) => void;
}

export default function CreateTransferModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateTransferModalProps) {
  const t = useTranslations(
    "students_guardians.transfers_withdrawals.modals.transfer",
  );

  const [formData, setFormData] = useState<Partial<TransferApplication>>({
    studentId: "",
    studentName: "",
    studentNameAr: "",
    stage: undefined,
    grade: "",
    type: "internal",
    targetClass: "",
    externalSchool: "",
    reason: "",
    effectiveDate: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showStudentSearch, setShowStudentSearch] = useState(false);

  const allStudents = getAllStudents();
  const filteredStudents = allStudents.filter(
    (student) =>
      student.full_name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.full_name_ar.includes(searchQuery) ||
      student.student_id?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleStudentSelect = (student: Student) => {
    setFormData({
      ...formData,
      studentId: student.student_id || student.id,
      studentName: student.full_name_en,
      studentNameAr: student.full_name_ar || "",
      stage:
        (student.stage as "primary" | "preparatory" | "secondary") || "primary",
      grade: student.gradeRequested,
    });
    setShowStudentSearch(false);
    setSearchQuery("");
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.studentId) newErrors.studentId = t("errors.student_required");
    if (!formData.type) newErrors.type = t("errors.type_required");
    if (formData.type === "internal" && !formData.targetClass) {
      newErrors.targetClass = t("errors.target_class_required");
    }
    if (formData.type === "external" && !formData.externalSchool) {
      newErrors.externalSchool = t("errors.external_school_required");
    }
    if (!formData.reason) newErrors.reason = t("errors.reason_required");
    if (!formData.effectiveDate)
      newErrors.effectiveDate = t("errors.date_required");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Student Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("fields.student")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.studentName || searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowStudentSearch(true);
                    }}
                    onFocus={() => setShowStudentSearch(true)}
                    placeholder={t("fields.search_student")}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStudentSearch(!showStudentSearch)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>

                {showStudentSearch && searchQuery && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => handleStudentSelect(student)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                          <div className="font-medium text-gray-900">
                            {student.full_name_en}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.student_id || student.id} • {student.stage}{" "}
                            • {student.gradeRequested}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        {t("no_students_found")}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {errors.studentId && (
                <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>
              )}
            </div>

            {/* Selected Student Info */}
            {formData.studentId && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">
                      {t("fields.student_id")}:
                    </span>
                    <span className="ml-2 font-medium">
                      {formData.studentId}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t("fields.stage")}:</span>
                    <span className="ml-2 font-medium">{formData.stage}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t("fields.grade")}:</span>
                    <span className="ml-2 font-medium">{formData.grade}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("fields.type")} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "internal" })}
                  className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                    formData.type === "internal"
                      ? "border-[#036b80] bg-[#036b80] text-white"
                      : "border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {t("types.internal")}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "external" })}
                  className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                    formData.type === "external"
                      ? "border-[#036b80] bg-[#036b80] text-white"
                      : "border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {t("types.external")}
                </button>
              </div>
            </div>

            {/* Target Class (Internal) */}
            {formData.type === "internal" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("fields.target_class")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.targetClass}
                  onChange={(e) =>
                    setFormData({ ...formData, targetClass: e.target.value })
                  }
                  placeholder={t("fields.target_class_placeholder")}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                />
                {errors.targetClass && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.targetClass}
                  </p>
                )}
              </div>
            )}

            {/* External School (External) */}
            {formData.type === "external" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("fields.external_school")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.externalSchool}
                  onChange={(e) =>
                    setFormData({ ...formData, externalSchool: e.target.value })
                  }
                  placeholder={t("fields.external_school_placeholder")}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
                />
                {errors.externalSchool && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.externalSchool}
                  </p>
                )}
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("fields.reason")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder={t("fields.reason_placeholder")}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
              )}
            </div>

            {/* Effective Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("fields.effective_date")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.effectiveDate}
                onChange={(e) =>
                  setFormData({ ...formData, effectiveDate: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              />
              {errors.effectiveDate && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.effectiveDate}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("fields.notes")}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={4}
                placeholder={t("fields.notes_placeholder")}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent resize-none"
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("fields.attachments")}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#036b80] transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {t("fields.upload_files")}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg font-medium transition-colors"
              >
                {t("submit")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
