"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { X, FileText, Download } from "lucide-react";
import { Application } from "@/features/admissions/types/admissions";
import {
  getStructureTreeSnapshot,
  resolveStructureContextForAcademicYear,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { useAdmissionsYearTermContext } from "@/features/admissions/shared/hooks/useAdmissionsYearTermContext";
import AdmissionsReadOnlyBanner from "@/features/admissions/shared/components/AdmissionsReadOnlyBanner";

export interface EnrollmentFormData {
  academicYear: string;
  grade: string;
  section: string;
  classroom: string;
  startDate: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
}

interface EnrollmentFormProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EnrollmentFormData) => void | Promise<void>;
}

const deriveDefaultAcademicYear = (application: Application) => {
  if (application.id.startsWith("APP-2024") || application.id.startsWith("APP-2026")) {
    return "2026-2027";
  }
  return "2025-2026";
};

const toLegacySectionLabel = (value: string) => {
  const englishMatch = value.match(/section\s+(.+)$/i);
  if (englishMatch?.[1]) return englishMatch[1].trim();

  const arabicMatch = value.match(/شعبة\s+(.+)$/);
  if (arabicMatch?.[1]) return arabicMatch[1].trim();

  return value;
};

export default function EnrollmentForm({
  application,
  isOpen,
  onClose,
  onSubmit,
}: EnrollmentFormProps) {
  const t = useTranslations("admissions.enrollment_form");
  const locale = useLocale();
  const { academicYears, yearId, isReadOnly } = useAdmissionsYearTermContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedAcademicYearName =
    academicYears.find((year) => year.id === yearId)?.name ||
    deriveDefaultAcademicYear(application);
  const [formData, setFormData] = useState<EnrollmentFormData>({
    academicYear: selectedAcademicYearName,
    grade: application.gradeRequested,
    section: "",
    classroom: "",
    startDate: application.join_date || "2026-09-01",
    gradeId: undefined,
    sectionId: undefined,
    classroomId: undefined,
  });

  useEffect(() => {
    if (!isOpen) return;

    setFormData({
      academicYear: selectedAcademicYearName,
      grade: application.gradeRequested,
      section: "",
      classroom: "",
      startDate: application.join_date || "2026-09-01",
      gradeId: undefined,
      sectionId: undefined,
      classroomId: undefined,
    });
  }, [application, isOpen, selectedAcademicYearName]);

  const structureContext = useMemo(
    () => resolveStructureContextForAcademicYear(formData.academicYear),
    [formData.academicYear],
  );

  const structure = useMemo(() => {
    if (!structureContext) return null;
    return getStructureTreeSnapshot(
      structureContext.academicYearId,
      structureContext.termId,
    );
  }, [structureContext]);

  const gradeOptions = useMemo(() => {
    if (!structure) return [];
    return structure.grades
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((grade) => ({
        id: grade.id,
        label: grade.nameEn || grade.nameAr || grade.name,
      }));
  }, [structure]);

  const selectedGradeId =
    formData.gradeId ||
    gradeOptions.find((grade) => grade.label === formData.grade)?.id;

  const sectionOptions = useMemo(() => {
    if (!structure || !selectedGradeId) return [];
    return structure.sections
      .filter((section) => section.gradeId === selectedGradeId)
      .sort((a, b) => a.order - b.order)
      .map((section) => ({
        id: section.id,
        label: section.nameEn || section.nameAr || section.name,
        legacyLabel: toLegacySectionLabel(section.nameEn || section.nameAr || section.name),
      }));
  }, [structure, selectedGradeId]);

  const selectedSectionId =
    formData.sectionId ||
    sectionOptions.find((section) => section.legacyLabel === formData.section)?.id;

  const classroomOptions = useMemo(() => {
    if (!structure || !selectedSectionId) return [];
    return structure.classrooms
      .filter((classroom) => classroom.sectionId === selectedSectionId)
      .sort((a, b) => a.order - b.order)
      .map((classroom) => ({
        id: classroom.id,
        label: classroom.nameEn || classroom.nameAr || classroom.name,
      }));
  }, [structure, selectedSectionId]);

  useEffect(() => {
    if (!isOpen || gradeOptions.length === 0) return;

    const preferredGrade =
      gradeOptions.find((grade) => grade.label === application.gradeRequested) ||
      gradeOptions.find((grade) => grade.id === formData.gradeId) ||
      gradeOptions[0];

    if (!preferredGrade) return;

    setFormData((prev) => {
      if (prev.gradeId === preferredGrade.id && prev.grade === preferredGrade.label) {
        return prev;
      }

      return {
        ...prev,
        grade: preferredGrade.label,
        gradeId: preferredGrade.id,
        section: "",
        sectionId: undefined,
        classroom: "",
        classroomId: undefined,
      };
    });
  }, [application.gradeRequested, formData.gradeId, gradeOptions, isOpen]);

  useEffect(() => {
    if (!isOpen || sectionOptions.length === 0 || !selectedGradeId) return;

    setFormData((prev) => {
      const hasValidSection = sectionOptions.some((section) => section.id === prev.sectionId);
      if (hasValidSection) return prev;

      return {
        ...prev,
        section: sectionOptions[0].legacyLabel,
        sectionId: sectionOptions[0].id,
        classroom: "",
        classroomId: undefined,
      };
    });
  }, [isOpen, sectionOptions, selectedGradeId]);

  useEffect(() => {
    if (!isOpen || classroomOptions.length === 0 || !selectedSectionId) return;

    setFormData((prev) => {
      const hasValidClassroom = classroomOptions.some((classroom) => classroom.id === prev.classroomId);
      if (hasValidClassroom) return prev;

      return {
        ...prev,
        classroom: classroomOptions[0].label,
        classroomId: classroomOptions[0].id,
      };
    });
  }, [classroomOptions, isOpen, selectedSectionId]);

  if (!isOpen) return null;

  const studentName =
    locale === "ar"
      ? application.full_name_ar ||
        application.studentNameArabic ||
        application.studentName
      : application.full_name_en || application.studentName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
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
          {isReadOnly && <AdmissionsReadOnlyBanner />}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("academic_year")} *
              </label>
              <select
                value={formData.academicYear}
                onChange={(e) =>
                  setFormData({
                    academicYear: e.target.value,
                    grade: "",
                    section: "",
                    classroom: "",
                    startDate: formData.startDate,
                    gradeId: undefined,
                    sectionId: undefined,
                    classroomId: undefined,
                  })
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                required
                disabled={isReadOnly}
              >
                {academicYears.map((year) => (
                  <option key={year.id} value={year.name}>
                    {year.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("grade")} *
              </label>
              <select
                value={formData.gradeId || ""}
                onChange={(e) => {
                  const selectedGrade = gradeOptions.find((grade) => grade.id === e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    grade: selectedGrade?.label || "",
                    gradeId: selectedGrade?.id,
                    section: "",
                    sectionId: undefined,
                    classroom: "",
                    classroomId: undefined,
                  }));
                }}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                required
                disabled={isReadOnly}
              >
                <option value="">{t("select_grade")}</option>
                {gradeOptions.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("section")} *
              </label>
              <select
                value={formData.sectionId || ""}
                onChange={(e) => {
                  const selectedSection = sectionOptions.find((section) => section.id === e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    section: selectedSection?.legacyLabel || "",
                    sectionId: selectedSection?.id,
                    classroom: "",
                    classroomId: undefined,
                  }));
                }}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                required
                disabled={isReadOnly || !formData.gradeId}
              >
                <option value="">{t("select_section")}</option>
                {sectionOptions.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("classroom")} *
              </label>
              <select
                value={formData.classroomId || ""}
                onChange={(e) => {
                  const selectedClassroom = classroomOptions.find((classroom) => classroom.id === e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    classroom: selectedClassroom?.label || "",
                    classroomId: selectedClassroom?.id,
                  }));
                }}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                required
                disabled={isReadOnly || !formData.sectionId}
              >
                <option value="">{t("select_classroom")}</option>
                {classroomOptions.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("start_date")} *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                required
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              {t("generate_documents")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGenerateAcceptance}
                disabled={isReadOnly}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
              >
                <FileText className="w-4 h-4" />
                {t("generate_acceptance")}
              </button>
              <button
                type="button"
                onClick={handleGenerateContract}
                disabled={isReadOnly}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                {t("generate_contract")}
              </button>
            </div>
          </div>

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
              disabled={
                isReadOnly ||
                isSubmitting ||
                !formData.gradeId ||
                !formData.sectionId ||
                !formData.classroomId ||
                !formData.startDate
              }
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg font-medium text-sm transition-colors"
            >
              {t("confirm_enrollment")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
