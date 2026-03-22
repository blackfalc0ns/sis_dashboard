"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { X, Search } from "lucide-react";
import {
  fetchAllStudents,
  getStudentEnrollment,
} from "@/features/students-guardians/students/services/studentsService";
import type { Student } from "@/features/students-guardians/students/types";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

interface CreateTransferWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApplicationData) => void;
}

interface ApplicationData {
  studentId: string;
  studentName: string;
  type: "transfer" | "withdrawal";
  reason: string;
  stage: string;
  grade: string;
  section: string;
  classroom: string;
  effectiveDate: string;
  notes: string;
}

const getStageFromGrade = (grade: string): string => {
  const gradeNumber = parseInt(grade.replace(/\D/g, ""), 10);
  if (gradeNumber >= 1 && gradeNumber <= 5) return "Primary";
  if (gradeNumber >= 6 && gradeNumber <= 9) return "Preparatory";
  if (gradeNumber >= 10 && gradeNumber <= 12) return "Secondary";
  return "Primary";
};

const initialFormData: ApplicationData = {
  studentId: "",
  studentName: "",
  type: "withdrawal",
  reason: "",
  stage: "",
  grade: "",
  section: "",
  classroom: "",
  effectiveDate: "",
  notes: "",
};

export default function CreateTransferWithdrawalModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateTransferWithdrawalModalProps) {
  const t = useTranslations("students_guardians.transfers_withdrawals.modal");

  const [formData, setFormData] = useState<ApplicationData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showStudentSearch, setShowStudentSearch] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;

    const loadStudents = async () => {
      setIsLoadingStudents(true);

      try {
        const students = await fetchAllStudents();

        if (!isMounted) {
          return;
        }

        setAllStudents(students);
      } finally {
        if (isMounted) {
          setIsLoadingStudents(false);
        }
      }
    };

    void loadStudents();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const filteredStudents = useMemo(() => {
    const searchValue = searchQuery.toLowerCase();

    return allStudents.filter((student) => {
      return (
        student.full_name_en.toLowerCase().includes(searchValue) ||
        student.full_name_ar.includes(searchQuery) ||
        student.student_id?.toLowerCase().includes(searchValue) ||
        student.id.toLowerCase().includes(searchValue)
      );
    });
  }, [allStudents, searchQuery]);

  const handleStudentSelect = (student: Student) => {
    const enrollment = getStudentEnrollment(student.id);
    const stage = student.stage || getStageFromGrade(student.gradeRequested);

    setFormData((prev) => ({
      ...prev,
      studentId: student.student_id || student.id,
      studentName: student.full_name_en,
      stage,
      grade: enrollment?.grade || student.gradeRequested,
      section: enrollment?.section || "",
      classroom: enrollment?.classroom || "",
    }));
    setShowStudentSearch(false);
    setSearchQuery("");
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.studentId) {
      newErrors.studentId = t("errors.student_required");
    }
    if (!formData.type) {
      newErrors.type = t("errors.type_required");
    }
    if (!formData.reason) {
      newErrors.reason = t("errors.reason_required");
    }
    if (!formData.effectiveDate) {
      newErrors.effectiveDate = t("errors.date_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    onSubmit(formData);
    setFormData(initialFormData);
    setErrors({});
    setSearchQuery("");
    setShowStudentSearch(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
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
            {isLoadingStudents ? <PartialLoader /> : null}

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
                      setFormData((prev) => ({
                        ...prev,
                        studentName: prev.studentId ? prev.studentName : e.target.value,
                      }));
                      setShowStudentSearch(true);
                    }}
                    onFocus={() => setShowStudentSearch(true)}
                    placeholder={t("fields.search_student")}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                      filteredStudents.map((student) => {
                        const enrollment = getStudentEnrollment(student.id);
                        const placement = [
                          enrollment?.grade || student.gradeRequested,
                          enrollment?.section,
                          enrollment?.classroom,
                        ]
                          .filter(Boolean)
                          .join(" • ");

                        return (
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
                              {student.student_id || student.id} • {student.stage || getStageFromGrade(student.gradeRequested)} • {placement}
                            </div>
                          </button>
                        );
                      })
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

            {formData.studentId && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">{t("fields.student_id")}:</span>
                    <span className="ml-2 font-medium">{formData.studentId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t("fields.stage")}:</span>
                    <span className="ml-2 font-medium">{formData.stage}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t("fields.grade")}:</span>
                    <span className="ml-2 font-medium">{formData.grade}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t("fields.section")}:</span>
                    <span className="ml-2 font-medium">{formData.section || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t("fields.classroom")}:</span>
                    <span className="ml-2 font-medium">{formData.classroom || "—"}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("fields.type")} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: "transfer" }))}
                  className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                    formData.type === "transfer"
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {t("types.transfer")}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: "withdrawal" }))}
                  className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                    formData.type === "withdrawal"
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {t("types.withdrawal")}
                </button>
              </div>
              {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("fields.reason")} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">{t("fields.select_reason")}</option>
                <option value="relocation">{t("reasons.relocation")}</option>
                <option value="financial">{t("reasons.financial")}</option>
                <option value="academic">{t("reasons.academic")}</option>
                <option value="behavior">{t("reasons.behavior")}</option>
                <option value="other">{t("reasons.other")}</option>
              </select>
              {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("fields.effective_date")} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, effectiveDate: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {errors.effectiveDate && (
                <p className="mt-1 text-sm text-red-600">{errors.effectiveDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("fields.notes")}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={4}
                placeholder={t("fields.notes_placeholder")}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

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
                className="px-6 py-2.5 bg-primary hover:bg-hover text-white rounded-lg font-medium transition-colors"
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
